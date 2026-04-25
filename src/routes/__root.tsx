import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { PrintReceipt } from "@/components/PrintReceipt";
import { useStore } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الصفحة التي تبحث عنها غير موجودة.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بوتيك الأناقة - نظام نقطة البيع" },
      { name: "description", content: "نظام نقطة بيع متكامل لمحلات الملابس - إدارة المنتجات والعملاء والشركاء" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const loc = useLocation();
  const navigate = useNavigate();
  const isAuth = useStore((s) => s.isAuthenticated);
  const lastInvoice = useStore((s) => s.lastInvoice);

  // حراسة المسارات
  useEffect(() => {
    if (!isAuth && loc.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [isAuth, loc.pathname, navigate]);

  // إذا كان على صفحة الدخول، اعرض المحتوى مباشرة بدون header
  if (loc.pathname === "/login") {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // إذا غير مصدّق، لا تعرض محتوى محمي
  if (!isAuth) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="no-print-bg">
        <Outlet />
      </main>
      {/* مكون الإيصال - مخفي إلا أثناء الطباعة */}
      <div className="print-only">
        <PrintReceipt invoice={lastInvoice} />
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
