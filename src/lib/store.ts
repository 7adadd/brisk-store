import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Category = {
  id: string;
  name: string;
  /** اسم الشريك (إن وُجد). إذا فارغ → القسم ملك للمتجر بالكامل */
  partner?: string;
  /** نسبة المتجر من الأرباح (0-100). الباقي للشريك */
  storeShare: number;
  color?: string;
};

export type Product = {
  id: string;
  barcode: string;
  name: string;
  categoryId: string;
  cost: number;
  price: number;
  stock: number;
  /** للملابس */
  size?: string;
  color?: string;
  brand?: string;
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
  cost: number;
  categoryId: string;
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

export type SystemUser = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: "admin" | "manager" | "cashier";
  active: boolean;
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
  users: SystemUser[];
  currentUser: string;
  currentUserRole: "admin" | "manager" | "cashier" | null;
  isAuthenticated: boolean;
  /** فاتورة آخر بيع — تُستخدم لطباعة الإيصال */
  lastInvoice: Invoice | null;

  login: (username: string, password: string) => boolean;
  logout: () => void;

  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

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

  addUser: (u: Omit<SystemUser, "id">) => void;
  updateUser: (id: string, u: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;

  updateSettings: (s: Partial<Settings>) => void;
  addBackup: (b: Omit<BackupRecord, "id" | "date">) => void;
  factoryReset: () => void;

  clearLastInvoice: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 11);

// === أقسام محل ملابس ===
const seedCategories: Category[] = [
  { id: "c1", name: "ملابس رجالي", partner: "", storeShare: 100, color: "#3b82f6" },
  { id: "c2", name: "ملابس حريمي", partner: "شركة النخبة", storeShare: 60, color: "#ec4899" },
  { id: "c3", name: "ملابس أطفال", partner: "", storeShare: 100, color: "#22c55e" },
  { id: "c4", name: "أحذية", partner: "محمد الشريك", storeShare: 50, color: "#f59e0b" },
  { id: "c5", name: "إكسسوارات", partner: "", storeShare: 100, color: "#a855f7" },
  { id: "c6", name: "حقائب", partner: "بوتيك ليلى", storeShare: 70, color: "#06b6d4" },
];

const seedProducts: Product[] = [
  // رجالي
  { id: "p1", barcode: "200001", name: "تيشرت قطن رجالي", categoryId: "c1", cost: 120, price: 220, stock: 30, size: "L", color: "أبيض", brand: "Cotton Plus" },
  { id: "p2", barcode: "200002", name: "بنطلون جينز رجالي", categoryId: "c1", cost: 280, price: 480, stock: 18, size: "32", color: "أزرق غامق", brand: "Levi’s" },
  { id: "p3", barcode: "200003", name: "قميص كلاسيك", categoryId: "c1", cost: 200, price: 380, stock: 22, size: "XL", color: "أزرق سماوي", brand: "Concrete" },
  // حريمي (شريك)
  { id: "p4", barcode: "200004", name: "فستان صيفي", categoryId: "c2", cost: 350, price: 650, stock: 14, size: "M", color: "وردي", brand: "النخبة" },
  { id: "p5", barcode: "200005", name: "بلوزة كاجوال", categoryId: "c2", cost: 180, price: 320, stock: 25, size: "S", color: "أسود", brand: "النخبة" },
  { id: "p6", barcode: "200006", name: "بنطلون حريمي", categoryId: "c2", cost: 220, price: 420, stock: 16, size: "M", color: "بيج", brand: "النخبة" },
  // أطفال
  { id: "p7", barcode: "200007", name: "طقم أطفال ولادي", categoryId: "c3", cost: 150, price: 280, stock: 35, size: "4-5 سنوات", color: "أزرق", brand: "Kids Zone" },
  { id: "p8", barcode: "200008", name: "فستان بناتي", categoryId: "c3", cost: 130, price: 260, stock: 28, size: "6-7 سنوات", color: "أحمر", brand: "Kids Zone" },
  // أحذية (شريك 50/50)
  { id: "p9", barcode: "200009", name: "حذاء رياضي رجالي", categoryId: "c4", cost: 400, price: 750, stock: 12, size: "42", color: "أبيض/أسود", brand: "Nike" },
  { id: "p10", barcode: "200010", name: "حذاء كعب حريمي", categoryId: "c4", cost: 280, price: 560, stock: 9, size: "38", color: "أسود", brand: "Aldo" },
  { id: "p11", barcode: "200011", name: "صندل أطفال", categoryId: "c4", cost: 90, price: 180, stock: 24, size: "30", color: "بني", brand: "Bata" },
  // إكسسوارات
  { id: "p12", barcode: "200012", name: "حزام جلد", categoryId: "c5", cost: 80, price: 180, stock: 40, color: "بني" },
  { id: "p13", barcode: "200013", name: "نظارة شمس", categoryId: "c5", cost: 150, price: 320, stock: 20, color: "أسود" },
  // حقائب (شريك 70/30)
  { id: "p14", barcode: "200014", name: "شنطة يد حريمي", categoryId: "c6", cost: 320, price: 620, stock: 11, color: "بيج", brand: "ليلى" },
  { id: "p15", barcode: "200015", name: "محفظة جلد", categoryId: "c6", cost: 140, price: 280, stock: 18, color: "أسود", brand: "ليلى" },
];

const seedCustomers: Customer[] = [
  { id: "cu1", name: "عميل نقدي", phone: "-", notes: "العميل الافتراضي", creditLimit: 0, balance: 0 },
  { id: "cu2", name: "محمود القاسم", phone: "01001234567", notes: "زبون دائم - يسمح بالآجل", creditLimit: 5000, balance: 1500 },
  { id: "cu3", name: "أحمد علي", phone: "01112223344", notes: "", creditLimit: 3000, balance: 0 },
  { id: "cu4", name: "سارة محمد", phone: "01223334455", notes: "VIP", creditLimit: 8000, balance: 0 },
];

const seedUsers: SystemUser[] = [
  { id: "u1", name: "المدير العام", username: "admin", password: "admin", role: "admin", active: true },
  { id: "u2", name: "محمد علي", username: "mohamed", password: "1234", role: "cashier", active: true },
  { id: "u3", name: "سارة أحمد", username: "sara", password: "1234", role: "manager", active: true },
];

const defaultSettings: Settings = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24",
  currency: "ج.م",
  decimals: 2,
  storeName: "بوتيك الأناقة",
  storePhone: "01000000000",
  storeAddress: "شارع الجمهورية - القاهرة",
  invoiceFooter: "شكراً لتسوقكم معنا 🛍️ - الاستبدال خلال 14 يوم بالفاتورة",
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
      users: seedUsers,
      currentUser: "",
      currentUserRole: null,
      isAuthenticated: false,
      lastInvoice: null,

      login: (username, password) => {
        const u = get().users.find(
          (x) => x.username === username.trim() && x.password === password && x.active
        );
        if (!u) return false;
        set({ isAuthenticated: true, currentUser: u.name, currentUserRole: u.role });
        return true;
      },

      logout: () =>
        set({ isAuthenticated: false, currentUser: "", currentUserRole: null }),

      addCategory: (c) => set((s) => ({ categories: [...s.categories, { ...c, id: uid() }] })),
      updateCategory: (id, c) =>
        set((s) => ({ categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),

      addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: uid() }] })),
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
          products: s.products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)),
          movements: [
            ...s.movements,
            {
              id: uid(),
              productId,
              type,
              qty,
              reason,
              user: s.currentUser || "نظام",
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
          cashier: s.currentUser || "نظام",
          status: "completed",
        };
        const newProducts = s.products.map((p) => {
          const item = inv.items.find((i) => i.productId === p.id);
          return item ? { ...p, stock: p.stock - item.qty } : p;
        });
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
            user: s.currentUser || "نظام",
            date: new Date().toISOString(),
            balance: p.stock,
          };
        });
        set({
          invoices: [...s.invoices, newInv],
          products: newProducts,
          customers: newCustomers,
          movements: [...s.movements, ...newMovements],
          lastInvoice: newInv,
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

      addUser: (u) => set((s) => ({ users: [...s.users, { ...u, id: uid() }] })),
      updateUser: (id, u) =>
        set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...u } : x)) })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((x) => x.id !== id) })),

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
          users: seedUsers,
          lastInvoice: null,
        }),

      clearLastInvoice: () => set({ lastInvoice: null }),
    }),
    { name: "pos-storage", version: 2 }
  )
);

export const formatCurrency = (n: number, settings?: Settings) => {
  const s = settings || useStore.getState().settings;
  return `${n.toFixed(s.decimals)} ${s.currency}`;
};
