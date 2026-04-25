import { useState } from "react";
import { useStore, type CartItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (cash: number, card: number) => void;
};

export function SplitPaymentDialog({ open, onClose, total, onConfirm }: Props) {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const sum = cash + card;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>تقسيم الفاتورة</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-secondary p-3 text-center">
            <div className="text-sm text-muted-foreground">الإجمالي</div>
            <div className="text-2xl font-bold">{total.toFixed(2)}</div>
          </div>
          <div>
            <Label>المبلغ نقدي</Label>
            <Input type="number" value={cash || ""} onChange={(e) => setCash(+e.target.value || 0)} />
          </div>
          <div>
            <Label>المبلغ بالبطاقة</Label>
            <Input type="number" value={card || ""} onChange={(e) => setCard(+e.target.value || 0)} />
          </div>
          <div className={`text-sm ${sum === total ? "text-success" : "text-destructive"}`}>
            المجموع: {sum.toFixed(2)} {sum !== total && `(الفرق: ${(total - sum).toFixed(2)})`}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => sum === total ? onConfirm(cash, card) : toast.error("المجموع غير مطابق")}>تأكيد الدفع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HoldInvoiceDialog({ open, onClose, items, customerId }: { open: boolean; onClose: () => void; items: CartItem[]; customerId: string }) {
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const holdInvoice = useStore((s) => s.holdInvoice);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>تعليق الفاتورة</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>اسم الفاتورة</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فاتورة أحمد" /></div>
          <div><Label>السبب</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: راح مشوار وراجع" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => {
            if (!name) return toast.error("ادخل اسم الفاتورة");
            holdInvoice({ name, reason, items, customerId });
            toast.success("تم تعليق الفاتورة");
            onClose();
          }}>تعليق الفاتورة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RestoreInvoiceDialog({ open, onClose, onRestore }: { open: boolean; onClose: () => void; onRestore: (items: CartItem[], customerId: string) => void }) {
  const heldInvoices = useStore((s) => s.heldInvoices);
  const restore = useStore((s) => s.restoreInvoice);
  const remove = useStore((s) => s.removeHeld);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>الفواتير المعلقة</DialogTitle></DialogHeader>
        <div className="max-h-96 overflow-auto space-y-2">
          {heldInvoices.length === 0 && <div className="text-center text-muted-foreground py-8">لا توجد فواتير معلقة</div>}
          {heldInvoices.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-semibold">{h.name}</div>
                <div className="text-xs text-muted-foreground">{h.reason} • {h.items.length} منتج</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => { remove(h.id); toast.success("تم الحذف"); }}>حذف</Button>
                <Button size="sm" onClick={() => {
                  const r = restore(h.id);
                  if (r) { onRestore(r.items, r.customerId); onClose(); toast.success("تم الاسترجاع"); }
                }}>استرجاع</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReturnDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [invNumber, setInvNumber] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const invoices = useStore((s) => s.invoices);
  const addReturn = useStore((s) => s.addReturn);

  const invoice = invoices.find((i) => i.id === selectedInvoiceId);

  const search = () => {
    const found = invoices.find((i) => i.number === invNumber.trim());
    if (!found) return toast.error("لم يتم العثور على الفاتورة");
    setSelectedInvoiceId(found.id);
  };

  const submit = () => {
    if (!invoice || !selectedItem) return toast.error("اختر منتجاً");
    if (!reason) return toast.error("أدخل سبب الإرجاع");
    const item = invoice.items.find((i) => i.productId === selectedItem)!;
    addReturn({
      invoiceId: invoice.id,
      productId: item.productId,
      productName: item.name,
      qty: item.qty,
      amount: item.price * item.qty,
      reason,
    });
    toast.success("تم تسجيل المرتجع");
    setInvNumber(""); setSelectedInvoiceId(null); setSelectedItem(null); setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>تسجيل مرتجع</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="رقم الفاتورة (مثل INV-00001)" value={invNumber} onChange={(e) => setInvNumber(e.target.value)} />
            <Button onClick={search}>بحث</Button>
          </div>
          {invoice && (
            <>
              <div className="rounded-md border p-2 max-h-60 overflow-auto">
                {invoice.items.map((item) => (
                  <label key={item.productId} className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-secondary ${selectedItem === item.productId ? "bg-accent" : ""}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={selectedItem === item.productId} onChange={() => setSelectedItem(item.productId)} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.qty} × {item.price}</span>
                  </label>
                ))}
              </div>
              <div><Label>سبب الإرجاع</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: منتج تالف" /></div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={!invoice}>تسجيل المرتجع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shortcuts = [
    ["F1", "عرض الاختصارات"],
    ["F2", "تركيز شريط البحث/الباركود"],
    ["F4", "دفع وطباعة"],
    ["F6", "تعليق الفاتورة"],
    ["F7", "استعادة فاتورة"],
    ["F8", "تقسيم الدفع"],
    ["Esc", "إفراغ السلة"],
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>اختصارات لوحة المفاتيح</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(([k, d]) => (
            <div key={k} className="flex items-center justify-between rounded-md border p-2">
              <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono font-bold">{k}</kbd>
              <span className="text-sm">{d}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
