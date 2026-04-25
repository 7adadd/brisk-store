import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingCart, Package, Users, BarChart3, UserCog, Settings as SettingsIcon, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{ to: string; label: string; icon: typeof ShoppingCart; exact?: boolean }> = [
  { to: "/", label: "نقطة البيع", icon: ShoppingCart, exact: true },
  { to: "/products", label: "المنتجات", icon: Package },
  { to: "/customers", label: "العملاء", icon: Users },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/users", label: "المستخدمين", icon: UserCog },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon },
];

export function AppHeader() {
  const loc = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex items-center gap-2 ml-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground">نظام POS</span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as "/"}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("ar-EG")}
        </div>
      </div>
    </header>
  );
}
