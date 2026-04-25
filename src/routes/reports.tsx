import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { FileDown, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير والتحليلات" },
      { name: "description", content: "تقارير المبيعات والمدفوعات والمرتجعات وإقفال اليوم" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const invoices = useStore((s) => s.invoices);
  const returns = useStore((s) => s.returns);
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [cashier, setCashier] = useState("all");
  const [payMethod, setPayMethod] = useState("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges = { day: 86400000, week: 7 * 86400000, month: 30 * 86400000 };
    return invoices.filter((i) => {
      if (now - new Date(i.date).getTime() > ranges[period]) return false;
      if (cashier !== "all" && i.cashier !== cashier) return false;
      if (payMethod !== "all" && i.paymentMethod !== payMethod) return false;
      return true;
    });
  }, [invoices, period, cashier, payMethod]);

  const salesTrend = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((i) => {
      const d = new Date(i.date).toLocaleDateString("ar-EG");
      map.set(d, (map.get(d) || 0) + i.total);
    });
    return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((i) => i.items.forEach((it) => map.set(it.name, (map.get(it.name) || 0) + it.qty)));
    return Array.from(map.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  const cashiers = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((i) => map.set(i.cashier, (map.get(i.cashier) || 0) + i.total));
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }));
  }, [invoices]);

  const totalSales = filtered.reduce((s, i) => s + i.total, 0);
  const totalReturns = returns.reduce((s, r) => s + r.amount, 0);
  const cashSum = filtered.filter((i) => i.paymentMethod === "cash").reduce((s, i) => s + i.total, 0);
  const cardSum = filtered.filter((i) => i.paymentMethod === "card").reduce((s, i) => s + i.total, 0);
  const creditSum = filtered.filter((i) => i.paymentMethod === "credit").reduce((s, i) => s + i.total, 0);
  const splitSum = filtered.filter((i) => i.paymentMethod === "split").reduce((s, i) => s + i.total, 0);

  const payData = [
    { name: "نقدي", value: cashSum, color: "oklch(0.62 0.17 155)" },
    { name: "بطاقة", value: cardSum, color: "oklch(0.65 0.15 220)" },
    { name: "آجل", value: creditSum, color: "oklch(0.75 0.16 75)" },
    { name: "مقسم", value: splitSum, color: "oklch(0.65 0.18 250)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="sales">تقارير المبيعات</TabsTrigger>
          <TabsTrigger value="payments">طرق الدفع والمرتجعات</TabsTrigger>
          <TabsTrigger value="customers">العملاء والديون</TabsTrigger>
          <TabsTrigger value="partners">الأقسام والشركاء 🤝</TabsTrigger>
          <TabsTrigger value="endofday">إقفال اليوم</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as "day" | "week" | "month")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">اليوم</SelectItem>
                <SelectItem value="week">الأسبوع</SelectItem>
                <SelectItem value="month">الشهر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cashier} onValueChange={setCashier}>
              <SelectTrigger className="w-44"><SelectValue placeholder="الكاشير" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الكاشيرية</SelectItem>
                {cashiers.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger className="w-40"><SelectValue placeholder="طريقة الدفع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الطرق</SelectItem>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="credit">آجل</SelectItem>
                <SelectItem value="split">مقسم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title="إجمالي المبيعات" value={totalSales.toFixed(2)} color="primary" />
            <StatCard title="عدد الفواتير" value={filtered.length.toString()} color="info" />
            <StatCard title="المرتجعات" value={totalReturns.toFixed(2)} color="destructive" />
            <StatCard title="صافي الإيراد" value={(totalSales - totalReturns).toFixed(2)} color="success" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 font-bold">اتجاه المبيعات</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 240)" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="oklch(0.52 0.18 250)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 font-bold">أفضل المنتجات</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 240)" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="oklch(0.62 0.17 155)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 font-bold">أفضل الكاشيرية</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cashiers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.015 240)" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="oklch(0.65 0.15 220)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-3 font-bold">طرق الدفع</div>
              {payData.length === 0 ? <div className="py-16 text-center text-muted-foreground">لا توجد بيانات</div> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={payData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                      {payData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("تم تصدير Excel")}><FileDown className="h-4 w-4" /> تصدير Excel</Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("تم تصدير CSV")}><FileText className="h-4 w-4" /> تصدير CSV</Button>
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr><th className="p-3 text-right">رقم</th><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">العميل</th><th className="p-3 text-right">الكاشير</th><th className="p-3 text-right">طريقة الدفع</th><th className="p-3 text-right">الإجمالي</th><th className="p-3 text-right">الحالة</th></tr></thead>
              <tbody>
                {invoices.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">لا توجد فواتير</td></tr>}
                {[...invoices].reverse().map((i) => (
                  <tr key={i.id} className="border-t hover:bg-secondary/40">
                    <td className="p-3 font-mono">{i.number}</td>
                    <td className="p-3 text-xs">{new Date(i.date).toLocaleString("ar-EG")}</td>
                    <td className="p-3">{i.customerName}</td>
                    <td className="p-3">{i.cashier}</td>
                    <td className="p-3"><span className="rounded bg-secondary px-2 py-0.5 text-xs">{i.paymentMethod}</span></td>
                    <td className="p-3 font-bold">{i.total.toFixed(2)}</td>
                    <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs ${i.status === "completed" ? "bg-success/10 text-success" : "bg-warning/20"}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title="نقدي" value={cashSum.toFixed(2)} color="success" />
            <StatCard title="بطاقة" value={cardSum.toFixed(2)} color="info" />
            <StatCard title="آجل" value={creditSum.toFixed(2)} color="warning" />
            <StatCard title="مقسم" value={splitSum.toFixed(2)} color="primary" />
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="border-b bg-secondary p-3 font-bold">قائمة المرتجعات</div>
            <table className="w-full text-sm">
              <thead className="bg-secondary/50"><tr><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">رقم الفاتورة</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">الكمية</th><th className="p-3 text-right">المبلغ</th><th className="p-3 text-right">السبب</th></tr></thead>
              <tbody>
                {returns.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا توجد مرتجعات</td></tr>}
                {returns.map((r) => {
                  const inv = invoices.find((i) => i.id === r.invoiceId);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 text-xs">{new Date(r.date).toLocaleDateString("ar-EG")}</td>
                      <td className="p-3 font-mono">{inv?.number}</td>
                      <td className="p-3">{r.productName}</td>
                      <td className="p-3">{r.qty}</td>
                      <td className="p-3 font-bold text-destructive">{r.amount.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{r.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr><th className="p-3 text-right">العميل</th><th className="p-3 text-right">عدد المشتريات</th><th className="p-3 text-right">إجمالي المشتريات</th><th className="p-3 text-right">حد الائتمان</th><th className="p-3 text-right">الديون</th></tr></thead>
              <tbody>
                {customers.map((c) => {
                  const cust = invoices.filter((i) => i.customerId === c.id);
                  const totalP = cust.reduce((s, i) => s + i.total, 0);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">{cust.length}</td>
                      <td className="p-3 font-bold text-primary">{totalP.toFixed(2)}</td>
                      <td className="p-3">{c.creditLimit}</td>
                      <td className="p-3 font-bold text-destructive">{c.balance.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <PartnersReport invoices={filtered} categories={categories} products={products} />
        </TabsContent>

        <TabsContent value="endofday" className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">إقفال اليوم</h2>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("تم تصدير PDF")}><FileText className="h-4 w-4" /> PDF</Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("تم تصدير Excel")}><FileDown className="h-4 w-4" /> Excel</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryItem label="إجمالي الفواتير" value={filtered.length.toString()} />
              <SummaryItem label="مبيعات اليوم" value={totalSales.toFixed(2)} highlight="primary" />
              <SummaryItem label="المرتجعات" value={totalReturns.toFixed(2)} highlight="destructive" />
              <SummaryItem label="صافي الإيراد" value={(totalSales - totalReturns).toFixed(2)} highlight="success" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryItem label="نقدي" value={cashSum.toFixed(2)} />
              <SummaryItem label="بطاقة" value={cardSum.toFixed(2)} />
              <SummaryItem label="آجل" value={creditSum.toFixed(2)} />
              <SummaryItem label="مقسم" value={splitSum.toFixed(2)} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: "primary" | "success" | "destructive" | "info" | "warning" }) {
  const map = {
    primary: "from-primary to-primary-glow",
    success: "from-success to-success",
    destructive: "from-destructive to-destructive",
    info: "from-info to-info",
    warning: "from-warning to-warning",
  };
  return (
    <div className={`rounded-lg bg-gradient-to-br ${map[color]} p-4 text-primary-foreground shadow-md`}>
      <div className="text-xs opacity-90">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: "primary" | "destructive" | "success" }) {
  const cls = highlight === "primary" ? "text-primary" : highlight === "destructive" ? "text-destructive" : highlight === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-md border p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
