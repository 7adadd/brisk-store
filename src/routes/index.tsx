import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStore, type CartItem, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Minus, Keyboard, Pause, RotateCcw, Split, Undo2, Search, Printer } from "lucide-react";
import { SplitPaymentDialog, HoldInvoiceDialog, RestoreInvoiceDialog, ReturnDialog, ShortcutsDialog } from "@/components/pos/PosDialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نقطة البيع - POS" },
      { name: "description", content: "شاشة نقطة البيع لإتمام المبيعات بسرعة" },
    ],
  }),
  component: PosPage,
});

function PosPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);
  const addInvoice = useStore((s) => s.addInvoice);
  const settings = useStore((s) => s.settings);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("cu1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [splitOpen, setSplitOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCat !== "all" && p.categoryId !== activeCat) return false;
      if (search && !p.name.includes(search) && !p.barcode.includes(search)) return false;
      return true;
    });
  }, [products, search, activeCat]);

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) return toast.error("المنتج غير متوفر");
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (existing.qty + 1 > product.stock) { toast.error("الكمية تجاوزت المخزون"); return prev; }
        return prev.map((i) => i.productId === productId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        productId,
        name: product.name,
        price: product.price,
        cost: product.cost,
        categoryId: product.categoryId,
        qty: 1,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return i;
      const product = products.find((p) => p.id === productId);
      if (product && newQty > product.stock) { toast.error("الكمية غير متوفرة"); return i; }
      return { ...i, qty: newQty };
    }));
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.productId !== productId));

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = products.find((p) => p.barcode === search.trim());
    if (found) { addToCart(found.id); setSearch(""); }
  };

  const customer = customers.find((c) => c.id === customerId);
  const isCredit = paymentMethod === "credit";

  const completeSale = (cashAmt?: number, cardAmt?: number) => {
    if (cart.length === 0) return toast.error("السلة فارغة");
    if (isCredit && customer) {
      if (customer.id === "cu1") return toast.error("لا يمكن البيع الآجل لعميل نقدي");
      if (customer.balance + total > customer.creditLimit) return toast.error("تجاوز حد الائتمان");
    }
    const inv = addInvoice({
      items: cart,
      customerId,
      customerName: customer?.name || "عميل نقدي",
      paymentMethod: cashAmt !== undefined && cardAmt !== undefined ? "split" : paymentMethod,
      cashAmount: cashAmt,
      cardAmount: cardAmt,
      total,
    });
    toast.success(`تم إنشاء الفاتورة ${inv.number}`);
    setCart([]); setCustomerId("cu1"); setPaymentMethod("cash");
    // طباعة الإيصال - الانتظار قليلاً حتى يتم تحديث الـ DOM
    setTimeout(() => window.print(), 200);
  };

  const handlePay = () => {
    if (cart.length === 0) return toast.error("السلة فارغة");
    completeSale();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F4") { e.preventDefault(); handlePay(); }
      if (e.key === "F6") { e.preventDefault(); setHoldOpen(true); }
      if (e.key === "F7") { e.preventDefault(); setRestoreOpen(true); }
      if (e.key === "F8") { e.preventDefault(); setSplitOpen(true); }
      if (e.key === "Escape") setCart([]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, customerId, paymentMethod]);

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[1fr_420px] gap-3 p-3">
      {/* Products area */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="flex gap-2">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="مسح الباركود أو البحث..."
              className="pr-9 h-11 text-base"
            />
          </form>
          <Button variant="outline" onClick={() => setShortcutsOpen(true)} className="h-11 gap-2">
            <Keyboard className="h-4 w-4" /> اختصارات (F1)
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <Button size="sm" variant={activeCat === "all" ? "default" : "outline"} onClick={() => setActiveCat("all")}>الكل</Button>
          {categories.map((c) => (
            <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pr-1">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p.id)}
              className="group flex flex-col rounded-lg border bg-card p-3 text-right shadow-sm transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
              disabled={p.stock <= 0}
            >
              <div className="mb-2 flex h-20 items-center justify-center rounded-md bg-secondary text-3xl">
                📦
              </div>
              <div className="text-sm font-medium line-clamp-2 mb-1">{p.name}</div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-muted-foreground">المخزون: {p.stock}</span>
                <span className="font-bold text-primary">{p.price}</span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">لا توجد منتجات</div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">سلة المشتريات</h2>
          {cart.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setCart([])}>إفراغ</Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary text-xs">
              <tr>
                <th className="p-2 text-right">المنتج</th>
                <th className="p-2 text-center w-28">الكمية</th>
                <th className="p-2 text-left w-20">الإجمالي</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">لا توجد منتجات</td></tr>
              )}
              {cart.map((item) => (
                <tr key={item.productId} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.price}</div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center font-bold">{item.qty}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </td>
                  <td className="p-2 text-left font-bold">{(item.price * item.qty).toFixed(2)}</td>
                  <td className="p-2"><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">العميل</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.id !== "cu1" && `(دين: ${c.balance})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">طريقة الدفع</label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "card" | "credit")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقد</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="credit">آجل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setSplitOpen(true)}><Split className="h-3 w-3" /> تقسيم</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setHoldOpen(true)}><Pause className="h-3 w-3" /> تعليق</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setRestoreOpen(true)}><RotateCcw className="h-3 w-3" /> استعادة</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setReturnOpen(true)}><Undo2 className="h-3 w-3" /> مرتجع</Button>
        </div>

        <div className="rounded-lg p-4 text-center" style={{ background: "var(--gradient-primary)" }}>
          <div className="text-xs text-primary-foreground/80">الإجمالي</div>
          <div className="text-3xl font-bold text-primary-foreground">{formatCurrency(total, settings)}</div>
        </div>

        <Button size="lg" className="h-14 text-base font-bold gap-2" onClick={handlePay}>
          <Printer className="h-5 w-5" /> دفع وطباعة (F4)
        </Button>
      </div>

      <SplitPaymentDialog
        open={splitOpen}
        onClose={() => setSplitOpen(false)}
        total={total}
        onConfirm={(cash, card) => { setSplitOpen(false); completeSale(cash, card); }}
      />
      <HoldInvoiceDialog open={holdOpen} onClose={() => setHoldOpen(false)} items={cart} customerId={customerId} />
      <RestoreInvoiceDialog open={restoreOpen} onClose={() => setRestoreOpen(false)} onRestore={(items, cId) => { setCart(items); setCustomerId(cId); }} />
      <ReturnDialog open={returnOpen} onClose={() => setReturnOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
