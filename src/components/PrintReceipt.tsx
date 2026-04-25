import { useStore, type Invoice, formatCurrency } from "@/lib/store";

/** إيصال طباعة - مخفي عن الشاشة، يظهر فقط أثناء الطباعة */
export function PrintReceipt({ invoice }: { invoice: Invoice | null }) {
  const settings = useStore((s) => s.settings);
  if (!invoice) return null;

  const subtotal = invoice.items.reduce((s, i) => s + i.price * i.qty, 0);
  const date = new Date(invoice.date);

  return (
    <div className="receipt-print" dir="rtl">
      <div className="text-center mb-2">
        {settings.showLogo && settings.storeLogo && (
          <img src={settings.storeLogo} alt="logo" className="mx-auto mb-1 h-12 object-contain" />
        )}
        <div className="text-lg font-bold">{settings.storeName}</div>
        <div className="text-xs">{settings.storeAddress}</div>
        <div className="text-xs">📞 {settings.storePhone}</div>
      </div>

      <div className="border-t border-b border-dashed border-black my-1 py-1 text-xs">
        <div>فاتورة رقم: <strong>{invoice.number}</strong></div>
        <div>التاريخ: {date.toLocaleString("ar-EG")}</div>
        <div>الكاشير: {invoice.cashier}</div>
        <div>العميل: {invoice.customerName}</div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-right py-0.5">الصنف</th>
            <th className="text-center">كم</th>
            <th className="text-center">سعر</th>
            <th className="text-left">إجمالي</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => (
            <tr key={idx}>
              <td className="py-0.5">{it.name}</td>
              <td className="text-center">{it.qty}</td>
              <td className="text-center">{it.price}</td>
              <td className="text-left">{(it.price * it.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black mt-1 pt-1 text-xs space-y-0.5">
        <Row label="الإجمالي" value={formatCurrency(subtotal, settings)} />
        <Row
          label="طريقة الدفع"
          value={
            invoice.paymentMethod === "cash" ? "نقدي" :
            invoice.paymentMethod === "card" ? "بطاقة" :
            invoice.paymentMethod === "credit" ? "آجل" : "مقسم"
          }
        />
        {invoice.paymentMethod === "split" && (
          <>
            <Row label="نقدي" value={(invoice.cashAmount || 0).toFixed(2)} />
            <Row label="بطاقة" value={(invoice.cardAmount || 0).toFixed(2)} />
          </>
        )}
        <Row label="المبلغ النهائي" value={formatCurrency(invoice.total, settings)} bold />
      </div>

      <div className="text-center text-xs mt-2 border-t border-dashed border-black pt-1">
        {settings.invoiceFooter}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-sm" : ""}`}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}
