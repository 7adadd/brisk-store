import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Printer, Sliders, History, FolderPlus, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "إدارة المنتجات" },
      { name: "description", content: "إدارة المنتجات والمخزون والفئات" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const movements = useStore((s) => s.movements);
  const addCategory = useStore((s) => s.addCategory);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const adjustStock = useStore((s) => s.adjustStock);

  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [prodOpen, setProdOpen] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [adjustProd, setAdjustProd] = useState<Product | null>(null);
  const [historyProd, setHistoryProd] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const [form, setForm] = useState({ barcode: "", name: "", categoryId: "", cost: 0, price: 0, stock: 0, image: "" });
  const resetForm = () => setForm({ barcode: "", name: "", categoryId: "", cost: 0, price: 0, stock: 0, image: "" });

  const openEdit = (p: Product) => { setEditProd(p); setForm({ ...p, image: p.image || "" }); setProdOpen(true); };
  const openAdd = () => { setEditProd(null); resetForm(); setProdOpen(true); };

  const saveProduct = () => {
    if (!form.name || !form.barcode || !form.categoryId) return toast.error("املأ الحقول الأساسية");
    if (editProd) { updateProduct(editProd.id, form); toast.success("تم التحديث"); }
    else { addProduct(form); toast.success("تم إضافة المنتج"); }
    setProdOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)} className="gap-2"><FolderPlus className="h-4 w-4" /> إضافة فئة</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><FileSpreadsheet className="h-4 w-4" /> استيراد إكسل</Button>
          <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> إضافة منتج</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="p-3 text-right">الباركود</th>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">الفئة</th>
              <th className="p-3 text-right">التكلفة</th>
              <th className="p-3 text-right">السعر</th>
              <th className="p-3 text-right">المخزون</th>
              <th className="p-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-t hover:bg-secondary/40">
                  <td className="p-3 font-mono text-xs">{p.barcode}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{cat?.name || "-"}</td>
                  <td className="p-3">{p.cost}</td>
                  <td className="p-3 font-bold text-primary">{p.price}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.stock <= 5 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="طباعة الباركود" onClick={() => toast.success(`تم إرسال باركود ${p.name} للطابعة`)}><Printer className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="تسوية المخزون" onClick={() => setAdjustProd(p)}><Sliders className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="سجل الحركة" onClick={() => setHistoryProd(p)}><History className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="تعديل" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="حذف" onClick={() => { if (confirm("حذف المنتج؟")) { deleteProduct(p.id); toast.success("تم الحذف"); } }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Category */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة فئة</DialogTitle></DialogHeader>
          <div><Label>اسم الفئة</Label><Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="مثل: كاميرات" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>إلغاء</Button>
            <Button onClick={() => { if (!catName) return; addCategory(catName); toast.success("تمت الإضافة"); setCatName(""); setCatOpen(false); }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit product */}
      <Dialog open={prodOpen} onOpenChange={setProdOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editProd ? "تعديل منتج" : "إضافة منتج"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>صورة المنتج</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }));
                reader.readAsDataURL(file);
              }} />
            </div>
            <div><Label>الباركود</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
            <div><Label>اسم المنتج</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>الفئة</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>الكمية المتوفرة</Label><Input type="number" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: +e.target.value || 0 })} /></div>
            <div><Label>سعر التكلفة</Label><Input type="number" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: +e.target.value || 0 })} /></div>
            <div><Label>سعر البيع</Label><Input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: +e.target.value || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdOpen(false)}>إلغاء</Button>
            <Button onClick={saveProduct}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust stock */}
      <Dialog open={!!adjustProd} onOpenChange={(o) => !o && setAdjustProd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسوية المخزون: {adjustProd?.name}</DialogTitle></DialogHeader>
          <AdjustForm product={adjustProd} onDone={() => setAdjustProd(null)} adjustStock={adjustStock} />
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={!!historyProd} onOpenChange={(o) => !o && setHistoryProd(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>سجل حركة: {historyProd?.name}</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr><th className="p-2 text-right">التاريخ</th><th className="p-2 text-right">المستخدم</th><th className="p-2 text-right">النوع</th><th className="p-2 text-right">الكمية</th><th className="p-2 text-right">السبب</th><th className="p-2 text-right">الرصيد</th></tr></thead>
              <tbody>
                {movements.filter((m) => m.productId === historyProd?.id).reverse().map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 text-xs">{new Date(m.date).toLocaleString("ar-EG")}</td>
                    <td className="p-2">{m.user}</td>
                    <td className="p-2"><span className="rounded bg-secondary px-2 py-0.5 text-xs">{m.type}</span></td>
                    <td className="p-2 font-bold">{m.qty}</td>
                    <td className="p-2 text-xs text-muted-foreground">{m.reason}</td>
                    <td className="p-2 font-bold text-primary">{m.balance}</td>
                  </tr>
                ))}
                {movements.filter((m) => m.productId === historyProd?.id).length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد حركات</td></tr>}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import excel */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>استيراد منتجات من إكسل</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full gap-2" onClick={() => toast.success("تم تحميل القالب")}><Download className="h-4 w-4" /> تحميل قالب إكسل (Template)</Button>
            <div>
              <Label>اختر الملف المعبأ</Label>
              <Input type="file" accept=".xlsx,.csv" onChange={() => setImportCount(Math.floor(Math.random() * 50) + 5)} />
            </div>
            {importCount > 0 && (
              <div className="rounded-md bg-info/10 p-3 text-sm">هل تريد استيراد {importCount} منتجات؟</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportCount(0); }}>إلغاء</Button>
            <Button disabled={!importCount} onClick={() => { toast.success(`تم استيراد ${importCount} منتجات`); setImportOpen(false); setImportCount(0); }}>تأكيد الاستيراد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdjustForm({ product, onDone, adjustStock }: { product: ReturnType<typeof useStore.getState>["products"][0] | null; onDone: () => void; adjustStock: ReturnType<typeof useStore.getState>["adjustStock"] }) {
  const [type, setType] = useState<"purchase" | "return" | "damage" | "adjustment">("purchase");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  if (!product) return null;
  return (
    <>
      <div className="space-y-3">
        <div>
          <Label>نوع الحركة</Label>
          <Select value={type} onValueChange={(v) => setType(v as "purchase" | "return" | "damage" | "adjustment")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">شراء</SelectItem>
              <SelectItem value="return">مرتجع</SelectItem>
              <SelectItem value="damage">تالف</SelectItem>
              <SelectItem value="adjustment">خصم</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>الكمية</Label><Input type="number" value={qty || ""} onChange={(e) => setQty(+e.target.value || 0)} /></div>
        <div><Label>السبب</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثل: استيراد من جوميا" /></div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onDone}>إلغاء</Button>
        <Button onClick={() => { if (qty <= 0) return toast.error("أدخل الكمية"); adjustStock(product.id, type, qty, reason); toast.success("تمت التسوية"); onDone(); }}>حفظ</Button>
      </DialogFooter>
    </>
  );
}
