import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  barcode: string;
  name: string;
  categoryId: string;
  cost: number;
  price: number;
  stock: number;
  image?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  type: "purchase" | "sale" | "return" | "damage" | "adjustment";
  qty: number;
  reason: string;
  user: string;
  date: string;
  balance: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  creditLimit: number;
  balance: number; // owed
};

export type CustomerPayment = {
  id: string;
  customerId: string;
  amount: number;
  notes: string;
  date: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  items: CartItem[];
  customerId: string;
  customerName: string;
  paymentMethod: "cash" | "card" | "credit" | "split";
  cashAmount?: number;
  cardAmount?: number;
  total: number;
  cashier: string;
  status: "completed" | "returned" | "partial-return";
};

export type HeldInvoice = {
  id: string;
  name: string;
  reason: string;
  items: CartItem[];
  customerId: string;
  date: string;
};

export type Return = {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  qty: number;
  amount: number;
  reason: string;
  date: string;
};

export type Settings = {
  dateFormat: string;
  timeFormat: "12" | "24";
  currency: string;
  decimals: number;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  invoiceFooter: string;
  storeLogo?: string;
  printer: string;
  paperSize: "80mm" | "58mm";
  copies: number;
  autoPrint: boolean;
  showLogo: boolean;
  barcodePrinter: string;
  barcodeType: "Code128" | "EAN13";
  labelSize: "small" | "medium" | "large";
  labelCopies: number;
  printProductName: boolean;
  printPrice: boolean;
  zpl: boolean;
};

export type BackupRecord = {
  id: string;
  date: string;
  type: "manual" | "auto" | "import";
  status: "success" | "failed";
};

type State = {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  invoices: Invoice[];
  heldInvoices: HeldInvoice[];
  returns: Return[];
  movements: StockMovement[];
  settings: Settings;
  backups: BackupRecord[];
  currentUser: string;

  addCategory: (name: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, type: StockMovement["type"], qty: number, reason: string) => void;

  addCustomer: (c: Omit<Customer, "id" | "balance">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  payCustomer: (customerId: string, amount: number, notes: string) => void;

  addInvoice: (inv: Omit<Invoice, "id" | "number" | "date" | "cashier" | "status">) => Invoice;
  holdInvoice: (h: Omit<HeldInvoice, "id" | "date">) => void;
  restoreInvoice: (id: string) => HeldInvoice | undefined;
  removeHeld: (id: string) => void;
  addReturn: (r: Omit<Return, "id" | "date">) => void;

  updateSettings: (s: Partial<Settings>) => void;
  addBackup: (b: Omit<BackupRecord, "id" | "date">) => void;
  factoryReset: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 11);

const seedCategories: Category[] = [
  { id: "c1", name: "كاميرات" },
  { id: "c2", name: "إكسسوارات" },
  { id: "c3", name: "هواتف" },
];

const seedProducts: Product[] = [
  { id: "p1", barcode: "100001", name: "كاميرا Canon EOS", categoryId: "c1", cost: 8000, price: 12000, stock: 5 },
  { id: "p2", barcode: "100002", name: "كاميرا Sony Alpha", categoryId: "c1", cost: 10000, price: 15000, stock: 3 },
  { id: "p3", barcode: "100003", name: "حامل ثلاثي", categoryId: "c2", cost: 200, price: 450, stock: 25 },
  { id: "p4", barcode: "100004", name: "بطاقة ذاكرة 64GB", categoryId: "c2", cost: 150, price: 300, stock: 50 },
  { id: "p5", barcode: "100005", name: "iPhone 15", categoryId: "c3", cost: 35000, price: 45000, stock: 8 },
  { id: "p6", barcode: "100006", name: "Samsung S24", categoryId: "c3", cost: 28000, price: 38000, stock: 6 },
  { id: "p7", barcode: "100007", name: "كفر حماية", categoryId: "c2", cost: 50, price: 150, stock: 100 },
  { id: "p8", barcode: "100008", name: "شاحن سريع", categoryId: "c2", cost: 80, price: 200, stock: 40 },
];

const seedCustomers: Customer[] = [
  { id: "cu1", name: "عميل نقدي", phone: "-", notes: "العميل الافتراضي", creditLimit: 0, balance: 0 },
  { id: "cu2", name: "محمود القاسم", phone: "01001234567", notes: "السماح بالبيع الآجل", creditLimit: 10000, balance: 2500 },
  { id: "cu3", name: "أحمد علي", phone: "01112223344", notes: "", creditLimit: 5000, balance: 0 },
];

const defaultSettings: Settings = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24",
  currency: "ج.م",
  decimals: 2,
  storeName: "متجر النور",
  storePhone: "01000000000",
  storeAddress: "القاهرة، مصر",
  invoiceFooter: "نورتونا 😊",
  printer: "طابعة افتراضية",
  paperSize: "80mm",
  copies: 1,
  autoPrint: true,
  showLogo: true,
  barcodePrinter: "Zebra ZD220",
  barcodeType: "Code128",
  labelSize: "medium",
  labelCopies: 1,
  printProductName: true,
  printPrice: true,
  zpl: false,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      products: seedProducts,
      customers: seedCustomers,
      customerPayments: [],
      invoices: [],
      heldInvoices: [],
      returns: [],
      movements: [],
      settings: defaultSettings,
      backups: [],
      currentUser: "الكاشير الرئيسي",

      addCategory: (name) =>
        set((s) => ({ categories: [...s.categories, { id: uid(), name }] })),

      addProduct: (p) =>
        set((s) => ({ products: [...s.products, { ...p, id: uid() }] })),

      updateProduct: (id, p) =>
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((x) => x.id !== id) })),

      adjustStock: (productId, type, qty, reason) => {
        const s = get();
        const product = s.products.find((p) => p.id === productId);
        if (!product) return;
        const delta = type === "sale" || type === "damage" ? -qty : qty;
        const newStock = product.stock + delta;
        set({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, stock: newStock } : p
          ),
          movements: [
            ...s.movements,
            {
              id: uid(),
              productId,
              type,
              qty,
              reason,
              user: s.currentUser,
              date: new Date().toISOString(),
              balance: newStock,
            },
          ],
        });
      },

      addCustomer: (c) =>
        set((s) => ({ customers: [...s.customers, { ...c, id: uid(), balance: 0 }] })),

      updateCustomer: (id, c) =>
        set((s) => ({ customers: s.customers.map((x) => (x.id === id ? { ...x, ...c } : x)) })),

      payCustomer: (customerId, amount, notes) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, balance: Math.max(0, c.balance - amount) } : c
          ),
          customerPayments: [
            ...s.customerPayments,
            { id: uid(), customerId, amount, notes, date: new Date().toISOString() },
          ],
        })),

      addInvoice: (inv) => {
        const s = get();
        const number = `INV-${(s.invoices.length + 1).toString().padStart(5, "0")}`;
        const newInv: Invoice = {
          ...inv,
          id: uid(),
          number,
          date: new Date().toISOString(),
          cashier: s.currentUser,
          status: "completed",
        };
        // Update stock
        const newProducts = s.products.map((p) => {
          const item = inv.items.find((i) => i.productId === p.id);
          return item ? { ...p, stock: p.stock - item.qty } : p;
        });
        // Update customer balance if credit
        const newCustomers = s.customers.map((c) => {
          if (c.id === inv.customerId && inv.paymentMethod === "credit") {
            return { ...c, balance: c.balance + inv.total };
          }
          return c;
        });
        const newMovements: StockMovement[] = inv.items.map((item) => {
          const p = newProducts.find((x) => x.id === item.productId)!;
          return {
            id: uid(),
            productId: item.productId,
            type: "sale" as const,
            qty: item.qty,
            reason: `بيع - ${number}`,
            user: s.currentUser,
            date: new Date().toISOString(),
            balance: p.stock,
          };
        });
        set({
          invoices: [...s.invoices, newInv],
          products: newProducts,
          customers: newCustomers,
          movements: [...s.movements, ...newMovements],
        });
        return newInv;
      },

      holdInvoice: (h) =>
        set((s) => ({
          heldInvoices: [...s.heldInvoices, { ...h, id: uid(), date: new Date().toISOString() }],
        })),

      restoreInvoice: (id) => {
        const inv = get().heldInvoices.find((h) => h.id === id);
        if (inv) set((s) => ({ heldInvoices: s.heldInvoices.filter((h) => h.id !== id) }));
        return inv;
      },

      removeHeld: (id) =>
        set((s) => ({ heldInvoices: s.heldInvoices.filter((h) => h.id !== id) })),

      addReturn: (r) => {
        const s = get();
        const newReturn: Return = { ...r, id: uid(), date: new Date().toISOString() };
        // Restock
        set({
          returns: [...s.returns, newReturn],
          products: s.products.map((p) =>
            p.id === r.productId ? { ...p, stock: p.stock + r.qty } : p
          ),
          invoices: s.invoices.map((inv) =>
            inv.id === r.invoiceId ? { ...inv, status: "partial-return" } : inv
          ),
        });
      },

      updateSettings: (newSettings) =>
        set((s) => ({ settings: { ...s.settings, ...newSettings } })),

      addBackup: (b) =>
        set((s) => ({
          backups: [{ ...b, id: uid(), date: new Date().toISOString() }, ...s.backups],
        })),

      factoryReset: () =>
        set({
          categories: seedCategories,
          products: seedProducts,
          customers: seedCustomers,
          customerPayments: [],
          invoices: [],
          heldInvoices: [],
          returns: [],
          movements: [],
          settings: defaultSettings,
          backups: [],
        }),
    }),
    { name: "pos-storage" }
  )
);

export const formatCurrency = (n: number, settings?: Settings) => {
  const s = settings || useStore.getState().settings;
  return `${n.toFixed(s.decimals)} ${s.currency}`;
};
