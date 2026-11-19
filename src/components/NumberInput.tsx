import { useEffect, useState, type InputHTMLAttributes } from 'react';

const parse = (s: string) => {
  const n = parseFloat(s.replace(/[£,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/**
 * A text input that edits a number without fighting the user mid-typing
 * (e.g. "12." stays "12." until they finish), and brings up the decimal keypad on phones.
 */
export function NumberInput({
  value,
  onValue,
  decimals = 2,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onValue: (n: number) => void;
  decimals?: number;
}) {
  const fmt = (n: number) => (n ? String(Math.round(n * 10 ** decimals) / 10 ** decimals) : '');
  const [text, setText] = useState(fmt(value));

  useEffect(() => {
    if (parse(text) !== value) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      value={text}
      onChange={(e) => {
        const next = e.target.value.replace(/[^0-9.,£\s]/g, '');
        setText(next);
        onValue(parse(next));
      }}
      onBlur={(e) => {
        setText(fmt(parse(text)));
        rest.onBlur?.(e);
      }}
    />
  );
}
