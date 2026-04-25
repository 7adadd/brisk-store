import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Customer } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "إدارة العملاء" },
      { name: "description", content: "إدارة العملاء والديون والمدفوعات" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const addCustomer = useStore((s) => s.addCustomer);
  const payCustomer = useStore((s) => s.payCustomer);
  const payments = useStore((s) => s.customerPayments);

  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "", creditLimit: 0 });
  const [payAmount, setPayAmount] = useState(0);
  const [payNotes, setPayNotes] = useState("");

  const save = () => {
    if (!form.name) return toast.error("ادخل اسم العميل");
    addCustomer(form);
    toast.success("تمت الإضافة");
    setForm({ name: "", phone: "", notes: "", creditLimit: 0 });
    setAddOpen(false);
  };

  const submitPayment = () => {
    if (!detail || payAmount <= 0) return toast.error("ادخل المبلغ");
    payCustomer(detail.id, payAmount, payNotes);
    const newBalance = Math.max(0, detail.balance - payAmount);
    toast.success(newBalance === 0 ? "تم تسديد الدين بالكامل ✓" : "تم تسجيل الدفعة");
    setPayAmount(0); setPayNotes("");
    setDetail({ ...detail, balance: newBalance });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة العملاء</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> إضافة عميل</Button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الهاتف</th><th className="p-3 text-right">حد الائتمان</th><th className="p-3 text-right">الرصيد المستحق</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t hover:bg-secondary/40">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.phone}</td>
                <td className="p-3">{c.creditLimit}</td>
                <td className="p-3 font-bold text-destructive">{c.balance}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.balance === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"}`}>
                    {c.balance === 0 ? "مسدد" : "مدين"}
                  </span>
                </td>
                <td className="p-3"><Button size="sm" variant="outline" onClick={() => setDetail(c)} className="gap-1"><Eye className="h-3 w-3" /> التفاصيل</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة عميل</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>اسم العميل</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>ملاحظات هامة</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="مثل: السماح بالبيع الآجل" /></div>
            <div><Label>حد الائتمان</Label><Input type="number" value={form.creditLimit || ""} onChange={(e) => setForm({ ...form, creditLimit: +e.target.value || 0 })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button><Button onClick={save}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>تفاصيل: {detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">حد الائتمان</div>
                  <div className="text-lg font-bold">{detail.creditLimit}</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">الرصيد المتاح</div>
                  <div className="text-lg font-bold text-success">{detail.creditLimit - detail.balance}</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">الرصيد المستحق</div>
                  <div className="text-lg font-bold text-destructive">{detail.balance}</div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="font-bold">تسديد الديون</div>
                <div><Label>المبلغ المدفوع</Label><Input type="number" value={payAmount || ""} onChange={(e) => setPayAmount(+e.target.value || 0)} /></div>
                <div><Label>ملاحظات</Label><Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="مثل: دفعة شهر 1" /></div>
                <Button onClick={submitPayment} disabled={detail.balance === 0} className="w-full">تأكيد الدفعة</Button>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold">سجل المدفوعات</div>
                <div className="max-h-40 overflow-auto rounded-md border">
                  {payments.filter((p) => p.customerId === detail.id).length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">لا توجد مدفوعات</div>}
                  {payments.filter((p) => p.customerId === detail.id).reverse().map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b p-2 text-sm last:border-b-0">
                      <span>{new Date(p.date).toLocaleDateString("ar-EG")}</span>
                      <span className="text-muted-foreground">{p.notes}</span>
                      <span className="font-bold text-success">{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
