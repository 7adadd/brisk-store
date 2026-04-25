import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, UserCog, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "إدارة المستخدمين" },
      { name: "description", content: "إدارة مستخدمي النظام والصلاحيات" },
    ],
  }),
  component: UsersPage,
});

type User = { id: string; name: string; username: string; role: "admin" | "cashier" | "manager"; active: boolean };

const initialUsers: User[] = [
  { id: "u1", name: "الكاشير الرئيسي", username: "admin", role: "admin", active: true },
  { id: "u2", name: "محمد علي", username: "mohamed", role: "cashier", active: true },
  { id: "u3", name: "سارة أحمد", username: "sara", role: "manager", active: true },
];

function UsersPage() {
  const currentUser = useStore((s) => s.currentUser);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", role: "cashier" as "admin" | "cashier" | "manager", password: "" });

  const roleNames = { admin: "مدير النظام", cashier: "كاشير", manager: "مشرف" };
  const roleColors = { admin: "bg-primary/10 text-primary", cashier: "bg-info/10 text-info", manager: "bg-warning/10 text-warning-foreground" };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> إضافة مستخدم</Button>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><UserCog className="h-6 w-6" /></div>
          <div>
            <div className="text-xs text-muted-foreground">المستخدم الحالي</div>
            <div className="font-bold">{currentUser}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">اسم المستخدم</th><th className="p-3 text-right">الصلاحية</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-secondary/40">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 font-mono text-xs">{u.username}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${roleColors[u.role]}`}>{roleNames[u.role]}</span></td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${u.active ? "bg-success/10 text-success" : "bg-muted"}`}>{u.active ? "نشط" : "موقوف"}</span></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setUsers((us) => us.map((x) => x.id === u.id ? { ...x, active: !x.active } : x))}>
                      {u.active ? "إيقاف" : "تفعيل"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("حذف المستخدم؟")) { setUsers((us) => us.filter((x) => x.id !== u.id)); toast.success("تم الحذف"); } }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة مستخدم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label>كلمة المرور</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "cashier" | "manager" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="manager">مشرف</SelectItem>
                  <SelectItem value="cashier">كاشير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={() => {
              if (!form.name || !form.username || !form.password) return toast.error("املأ الحقول");
              setUsers([...users, { id: Math.random().toString(36).slice(2), name: form.name, username: form.username, role: form.role, active: true }]);
              toast.success("تم إضافة المستخدم");
              setForm({ name: "", username: "", role: "cashier", password: "" });
              setOpen(false);
            }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
