import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Settings } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, Database, Upload, Printer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "إعدادات النظام" },
      { name: "description", content: "إعدادات المتجر والطباعة والنسخ الاحتياطي" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const backups = useStore((s) => s.backups);
  const addBackup = useStore((s) => s.addBackup);
  const factoryReset = useStore((s) => s.factoryReset);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => updateSettings({ [key]: value } as Partial<Settings>);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">الإعدادات</h1>

      <Tabs defaultValue="program" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="program">إعدادات البرنامج</TabsTrigger>
          <TabsTrigger value="store">بيانات المتجر</TabsTrigger>
          <TabsTrigger value="invoice">طباعة الفواتير</TabsTrigger>
          <TabsTrigger value="barcode">طباعة الباركود</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="reset">إعادة ضبط</TabsTrigger>
        </TabsList>

        <TabsContent value="program">
          <Section title="إعدادات البرنامج">
            <Field label="صيغة التاريخ"><Input value={settings.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} /></Field>
            <Field label="صيغة الوقت">
              <Select value={settings.timeFormat} onValueChange={(v) => set("timeFormat", v as "12" | "24")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="12">12 ساعة</SelectItem><SelectItem value="24">24 ساعة</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="رمز العملة"><Input value={settings.currency} onChange={(e) => set("currency", e.target.value)} /></Field>
            <Field label="المنازل العشرية"><Input type="number" value={settings.decimals} onChange={(e) => set("decimals", +e.target.value)} /></Field>
          </Section>
        </TabsContent>

        <TabsContent value="store">
          <Section title="بيانات المتجر">
            <Field label="اسم المتجر"><Input value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} /></Field>
            <Field label="رقم الهاتف"><Input value={settings.storePhone} onChange={(e) => set("storePhone", e.target.value)} /></Field>
            <Field label="العنوان الافتراضي" full><Input value={settings.storeAddress} onChange={(e) => set("storeAddress", e.target.value)} /></Field>
            <Field label="تذييل الفاتورة" full><Textarea value={settings.invoiceFooter} onChange={(e) => set("invoiceFooter", e.target.value)} /></Field>
            <Field label="رفع شعار المتجر" full>
              <Input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = () => { set("storeLogo", r.result as string); toast.success("تم رفع الشعار"); }; r.readAsDataURL(f);
              }} />
              {settings.storeLogo && <img src={settings.storeLogo} alt="logo" className="mt-2 h-16 rounded border" />}
            </Field>
          </Section>
        </TabsContent>

        <TabsContent value="invoice">
          <Section title="إعدادات طباعة الفواتير">
            <Field label="الطابعة الافتراضية"><Input value={settings.printer} onChange={(e) => set("printer", e.target.value)} /></Field>
            <Field label="مقاس الورق">
              <Select value={settings.paperSize} onValueChange={(v) => set("paperSize", v as "80mm" | "58mm")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="80mm">80mm</SelectItem><SelectItem value="58mm">58mm</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="عدد النسخ"><Input type="number" value={settings.copies} onChange={(e) => set("copies", +e.target.value || 1)} /></Field>
            <Field label="تفعيل الطباعة التلقائية"><Switch checked={settings.autoPrint} onCheckedChange={(v) => set("autoPrint", v)} /></Field>
            <Field label="إظهار شعار المتجر"><Switch checked={settings.showLogo} onCheckedChange={(v) => set("showLogo", v)} /></Field>
            <div className="col-span-2"><Button variant="outline" className="gap-2" onClick={() => toast.success("تم إرسال صفحة اختبار للطابعة")}><Printer className="h-4 w-4" /> اختبار الطباعة</Button></div>
          </Section>
        </TabsContent>

        <TabsContent value="barcode">
          <Section title="إعدادات طباعة الباركود">
            <Field label="الطابعة"><Input value={settings.barcodePrinter} onChange={(e) => set("barcodePrinter", e.target.value)} /></Field>
            <Field label="نوع الباركود">
              <Select value={settings.barcodeType} onValueChange={(v) => set("barcodeType", v as "Code128" | "EAN13")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Code128">Code 128</SelectItem><SelectItem value="EAN13">EAN 13</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="حجم الملصق">
              <Select value={settings.labelSize} onValueChange={(v) => set("labelSize", v as "small" | "medium" | "large")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="small">صغير</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="large">كبير</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="عدد النسخ"><Input type="number" value={settings.labelCopies} onChange={(e) => set("labelCopies", +e.target.value || 1)} /></Field>
            <Field label="طباعة اسم المنتج"><Switch checked={settings.printProductName} onCheckedChange={(v) => set("printProductName", v)} /></Field>
            <Field label="طباعة السعر"><Switch checked={settings.printPrice} onCheckedChange={(v) => set("printPrice", v)} /></Field>
            <Field label="استخدام ZPL"><Switch checked={settings.zpl} onCheckedChange={(v) => set("zpl", v)} /></Field>
          </Section>
        </TabsContent>

        <TabsContent value="backup">
          <Section title="النسخ الاحتياطي">
            <div className="col-span-2 flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => { addBackup({ type: "manual", status: "success" }); toast.success("تم إنشاء النسخة"); }}><Database className="h-4 w-4" /> إنشاء نسخة فورية</Button>
              <Button variant="outline" className="gap-2" onClick={() => { addBackup({ type: "import", status: "success" }); toast.success("تم الاستيراد"); }}><Upload className="h-4 w-4" /> استيراد من ملف</Button>
              <Button variant="outline" className="gap-2" onClick={() => toast.success("تم تفعيل النسخ اليومي التلقائي")}><Save className="h-4 w-4" /> تفعيل النسخ اليومي التلقائي</Button>
            </div>
            <div className="col-span-2">
              <div className="mb-2 font-bold">سجل العمليات</div>
              <div className="rounded-md border max-h-72 overflow-auto">
                {backups.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">لا توجد عمليات</div>}
                {backups.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b p-3 text-sm last:border-b-0">
                    <span>{new Date(b.date).toLocaleString("ar-EG")}</span>
                    <span className="text-muted-foreground">{b.type}</span>
                    <span className={`rounded px-2 py-0.5 text-xs ${b.status === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="reset">
          <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-destructive">إعادة ضبط المصنع</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  سيؤدي هذا الإجراء إلى حذف جميع البيانات (المنتجات، العملاء، الفواتير، التقارير) وإعادة النظام لنقطة الصفر. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <Button variant="destructive" className="mt-4" onClick={() => setResetOpen(true)}>إعادة ضبط النظام</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={resetOpen} onOpenChange={(o) => { setResetOpen(o); if (!o) setResetText(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-destructive">تأكيد إعادة ضبط النظام</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">للتأكيد، اكتب كلمة <strong className="font-mono bg-secondary px-2 py-0.5 rounded">Reset</strong></p>
            <Input value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="Reset" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>إلغاء</Button>
            <Button variant="destructive" disabled={resetText !== "Reset"} onClick={() => { factoryReset(); toast.success("تمت إعادة الضبط"); setResetOpen(false); setResetText(""); }}>تأكيد الإعادة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
