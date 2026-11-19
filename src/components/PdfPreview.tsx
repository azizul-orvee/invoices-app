import { useEffect, useRef, useState } from 'react';
import { cx } from './ui';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs() {
  pdfjsPromise ??= (async () => {
    const [lib, worker] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]);
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  })();
  return pdfjsPromise;
}

/**
 * Draws the actual generated PDF onto canvases, so what you see is exactly what downloads.
 * The previous render stays on screen until the new one is ready — no flicker while typing.
 */
export function PdfPreview({ blob, busy, className }: { blob: Blob | null; busy?: boolean; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useRef(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let t: number | undefined;
    const ro = new ResizeObserver(([entry]) => {
      window.clearTimeout(t);
      const w = Math.round(entry.contentRect.width);
      t = window.setTimeout(() => setWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev)), 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!blob || !width) return;
    const my = ++token.current;
    let cancelled = false;
    let task: ReturnType<PdfJs['getDocument']> | null = null;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const data = new Uint8Array(await blob.arrayBuffer());
        task = pdfjs.getDocument({ data });
        const doc = await task.promise;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'block w-full h-auto bg-white rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_48px_-24px_rgba(17,19,24,.35)]';
          await page.render({ canvas, viewport }).promise;
          canvases.push(canvas);
          if (cancelled || my !== token.current) return;
        }
        if (cancelled || my !== token.current || !hostRef.current) return;
        const host = hostRef.current;
        host.replaceChildren(...canvases);
        canvases.forEach((c, i) => {
          if (i > 0) c.style.marginTop = '16px';
        });
        setReady(true);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Preview failed');
      } finally {
        task?.destroy();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob, width]);

  return (
    <div className={cx('relative', className)}>
      {!ready && !error ? (
        <div className="absolute inset-0 overflow-hidden rounded-[6px] bg-white">
          <div className="space-y-4 p-[8%]">
            <div className="skeleton h-8 w-1/3 rounded-md" />
            <div className="skeleton h-3 w-1/4 rounded" />
            <div className="skeleton h-3 w-1/5 rounded" />
            <div className="skeleton mt-10 h-16 w-full rounded-lg" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
          </div>
        </div>
      ) : null}
      <div
        ref={hostRef}
        className={cx('min-h-[60px] transition-opacity duration-300', !ready && 'aspect-[210/297] opacity-0', busy && ready && 'opacity-80')}
      />
      {error ? <p className="mt-3 text-center text-sm text-danger">Preview error: {error}</p> : null}
    </div>
  );
}
