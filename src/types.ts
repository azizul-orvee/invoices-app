export interface QuickItem {
  description: string;
  /** Price including VAT, in pounds. 0 = ask each time. */
  price: number;
}

export interface Profile {
  id: string;
  /** Short name shown on the profile switcher, e.g. "ETR". */
  label: string;
  companyName: string;
  tagline: string;
  /** Data URL (uploaded) or app-relative path (seeded). */
  logo: string;
  brandColor: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  vatNumber: string;
  companyNumber: string;
  invoicePrefix: string;
  paymentTermsDays: number;
  bankAccountName: string;
  bankSortCode: string;
  bankAccountNumber: string;
  /** Printed in the payment section of every invoice. */
  defaultNote: string;
  /** Small print at the bottom (terms, warranty, etc). */
  terms: string;
  quickItems: QuickItem[];
  updatedAt: number;
}

export interface LineItem {
  id: string;
  description: string;
  detail: string;
  qty: number;
  /** Unit price INCLUDING 20% VAT, as typed by the user. */
  price: number;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type PaymentMethod = 'card' | 'cash' | 'bank' | 'other';

export interface Customer {
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface Invoice {
  id: string;
  profileId: string;
  number: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  customer: Customer;
  vehicleReg: string;
  reference: string;
  items: LineItem[];
  status: PaymentStatus;
  method: PaymentMethod;
  amountPaid: number;
  notes: string;
  savedAt?: number;
}
