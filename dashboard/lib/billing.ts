export type CommissionModel = "percentage" | "per_lead";
export type InvoiceStatus = "PAID" | "UNPAID";

export type CommissionRate = {
  key: string;
  label: string;
  model: CommissionModel;
  value: number;
};

export type CommissionRates = {
  categories: CommissionRate[];
  effectiveFrom: string | null;
};

export type InvoiceLine = {
  category: string;
  label: string;
  model: CommissionModel;
  rate: number;
  bookings: number;
  bookingValue: number;
  commission: number;
  description: string;
};

export type BillingProvider = {
  vendorId: string;
  vendorCode: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  joinedDate: string;
  image: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  period: string;
  periodLabel: string;
  provider: BillingProvider;
  lines: InvoiceLine[];
  bookings: number;
  bookingValue: number;
  amountDue: number;
  status: InvoiceStatus;
  overdue: boolean;
  dueDate: string;
  paidAt: string | null;
  reminderSentAt: string | null;
};

export type BusinessDetails = {
  name: string;
  address: string;
  email: string;
  phone: string;
};

export type BillingOverview = {
  period: string;
  periodLabel: string;
  periods: Array<{ value: string; label: string }>;
  summary: {
    bookingValue: number;
    completedBookings: number;
    commissionDue: number;
    collected: number;
    outstanding: number;
    unpaidInvoices: number;
    providers: number;
  };
  invoices: Invoice[];
  rates: CommissionRates;
  business: BusinessDetails;
};

export const emptyBillingOverview: BillingOverview = {
  period: "",
  periodLabel: "",
  periods: [],
  summary: { bookingValue: 0, completedBookings: 0, commissionDue: 0, collected: 0, outstanding: 0, unpaidInvoices: 0, providers: 0 },
  invoices: [],
  rates: { categories: [], effectiveFrom: null },
  business: { name: "Activity Planner", address: "", email: "", phone: "" },
};

export function formatMoney(value: number) {
  return `$${(Number.isFinite(value) ? value : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function describeRate(model: CommissionModel, value: number) {
  return model === "per_lead" ? `${formatMoney(value)} per lead` : `${value}% of booking value`;
}

export function lineRate(line: InvoiceLine) {
  return line.model === "per_lead" ? `${formatMoney(line.rate)} / lead` : `${line.rate}%`;
}
