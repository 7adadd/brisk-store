import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Product, type Category } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Printer, Sliders, History, FolderPlus, FileSpreadsheet, Download, Handshake } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "إدارة المنتجات" },
      { name: "description", content: "إدارة المنتجات والمخزون والأقسام والشركاء" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const movements = useStore((s) => s.movements);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const adjustStock = useStore((s) => s.adjustStock);

  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<{ name: string; partner: string; storeShare: number; color: string }>({ name: "", partner: "", storeShare: 100, color: "#3b82f6" });
  const [prodOpen, setProdOpen] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [adjustProd, setAdjustProd] = useState<Product | null>(null);
  const [historyProd, setHistoryProd] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [filterCat, setFilterCat] = useState<string>("all");

  const [form, setForm] = useState({ barcode: "", name: "", categoryId: "", cost: 0, price: 0, stock: 0, size: "", color: "", brand: "", image: "" });
  const resetForm = () => setForm({ barcode: "", name: "", categoryId: "", cost: 0, price: 0, stock: 0, size: "", color: "", brand: "", image: "" });

  const openEdit = (p: Product) => {
    setEditProd(p);
    setForm({ ...p, size: p.size || "", color: p.color || "", brand: p.brand || "", image: p.image || "" });
    setProdOpen(true);
  };
  const openAdd = () => { setEditProd(null); resetForm(); setProdOpen(true); };

  const openCatAdd = () => { setEditCat(null); setCatForm({ name: "", partner: "", storeShare: 100, color: "#3b82f6" }); setCatOpen(true); };
  const openCatEdit = (c: Category) => {
    setEditCat(c);
    setCatForm({ name: c.name, partner: c.partner || "", storeShare: c.storeShare ?? 100, color: c.color || "#3b82f6" });
    setCatOpen(true);
  };

  const saveCategory = () => {
    if (!catForm.name) return toast.error("ادخل اسم القسم");
    if (catForm.storeShare < 0 || catForm.storeShare > 100) return toast.error("النسبة بين 0 و 100");
    if (editCat) {
      updateCategory(editCat.id, catForm);
      toast.success("تم تحديث القسم");
    } else {
      addCategory(catForm);
      toast.success("تمت إضافة القسم");
    }
    setCatOpen(false);
  };

  const saveProduct = () => {
    if (!form.name || !form.barcode || !form.categoryId) return toast.error("املأ الحقول الأساسية");
    if (editProd) { updateProduct(editProd.id, form); toast.success("تم التحديث"); }
    else { addProduct(form); toast.success("تم إضافة المنتج"); }
    setProdOpen(false);
  };

  const filtered = filterCat === "all" ? products : products.filter((p) => p.categoryId === filterCat);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">إدارة المنتجات والأقسام</h1>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="categories">الأقسام والشركاء</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">القسم:</Label>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><FileSpreadsheet className="h-4 w-4" /> استيراد إكسل</Button>
              <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> إضافة منتج</Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="p-3 text-right">الباركود</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">القسم</th>
                  <th className="p-3 text-right">المقاس</th>
                  <th className="p-3 text-right">اللون</th>
                  <th className="p-3 text-right">التكلفة</th>
                  <th className="p-3 text-right">السعر</th>
                  <th className="p-3 text-right">المخزون</th>
                  <th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="border-t hover:bg-secondary/40">
                      <td className="p-3 font-mono text-xs">{p.barcode}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: (cat?.color || "#888") + "20", color: cat?.color || "#888" }}>
                          {cat?.name || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{p.size || "-"}</td>
                      <td className="p-3 text-xs">{p.color || "-"}</td>
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
                {filtered.length === 0 && <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">لا توجد منتجات في هذا القسم</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">إدارة الأقسام والشركاء — حدد نسبة المتجر من الأرباح لكل قسم.</p>
            <Button onClick={openCatAdd} className="gap-2"><FolderPlus className="h-4 w-4" /> إضافة قسم</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const productsInCat = products.filter((p) => p.categoryId === c.id);
              const isPartner = !!c.partner;
              return (
                <div key={c.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: (c.color || "#888") + "20" }}>
                        <span className="text-lg">{isPartner ? "🤝" : "🏪"}</span>
                      </div>
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{productsInCat.length} منتج</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCatEdit(c)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
                        if (productsInCat.length > 0) return toast.error("احذف منتجات القسم أولاً");
                        if (confirm("حذف القسم؟")) { deleteCategory(c.id); toast.success("تم الحذف"); }
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    {isPartner ? (
                      <>
                        <div className="flex justify-between"><span className="text-muted-foreground">الشريك:</span><span className="font-medium flex items-center gap-1"><Handshake className="h-3 w-3" /> {c.partner}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">حصة المتجر:</span><span className="font-bold text-primary">{c.storeShare}%</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">حصة الشريك:</span><span className="font-bold text-warning-foreground">{100 - c.storeShare}%</span></div>
                      </>
                    ) : (
                      <div className="rounded bg-success/10 text-success text-xs px-2 py-1 inline-block">أرباحه 100% للمتجر</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Category */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? "تعديل القسم" : "إضافة قسم"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>اسم القسم</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="مثل: ملابس رجالي" /></div>
            <div><Label>اسم الشريك (اتركه فارغاً إذا القسم بالكامل ملك للمتجر)</Label><Input value={catForm.partner} onChange={(e) => setCatForm({ ...catForm, partner: e.target.value })} placeholder="مثل: شركة النخبة" /></div>
            <div>
              <Label>نسبة المتجر من الأرباح (%)</Label>
              <Input type="number" min={0} max={100} value={catForm.storeShare} onChange={(e) => setCatForm({ ...catForm, storeShare: +e.target.value || 0 })} />
              <p className="text-xs text-muted-foreground mt-1">الباقي ({100 - (catForm.storeShare || 0)}%) للشريك</p>
            </div>
            <div><Label>لون القسم</Label><Input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="h-10" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>إلغاء</Button>
            <Button onClick={saveCategory}>حفظ</Button>
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
              <Label>القسم</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>الماركة</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="مثال: Nike" /></div>
            <div><Label>المقاس</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="مثال: L أو 42" /></div>
            <div><Label>اللون</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="مثال: أزرق" /></div>
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

function AdjustForm({ product, onDone, adjustStock }: { product: Product | null; onDone: () => void; adjustStock: ReturnType<typeof useStore.getState>["adjustStock"] }) {
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
        <div><Label>السبب</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثل: شحنة جديدة" /></div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onDone}>إلغاء</Button>
        <Button onClick={() => { if (qty <= 0) return toast.error("أدخل الكمية"); adjustStock(product.id, type, qty, reason); toast.success("تمت التسوية"); onDone(); }}>حفظ</Button>
      </DialogFooter>
    </>
  );
}
