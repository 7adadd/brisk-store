import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Lock, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول - بوتيك الأناقة" },
      { name: "description", content: "تسجيل الدخول لنظام نقطة البيع" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const isAuth = useStore((s) => s.isAuthenticated);
  const settings = useStore((s) => s.settings);
  const users = useStore((s) => s.users);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isAuth) navigate({ to: "/" });
  }, [isAuth, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error("ادخل اسم المستخدم وكلمة المرور");
    const ok = login(username, password);
    if (ok) {
      toast.success("مرحباً بك 👋");
      navigate({ to: "/" });
    } else {
      toast.error("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="absolute inset-0 -z-10 opacity-30"
        style={{ background: "var(--gradient-primary)" }} />
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-3"
            style={{ background: "var(--gradient-primary)" }}>
            <Store className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{settings.storeName}</h1>
          <p className="text-sm text-muted-foreground mt-1">نظام نقطة البيع</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">اسم المستخدم</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="pr-9 h-11"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="pr-9 h-11"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-12 text-base font-bold">
            تسجيل الدخول
          </Button>

          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {showHint ? "إخفاء" : "عرض"} حسابات تجريبية
          </button>

          {showHint && (
            <div className="rounded-md border bg-secondary/40 p-3 text-xs space-y-1">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between">
                  <span className="font-mono">{u.username} / {u.password}</span>
                  <span className="text-muted-foreground">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
