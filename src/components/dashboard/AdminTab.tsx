import { Shield, UserPlus, Plus, Minus, CreditCard, Send, Eye, MessageSquare, Trash2, Monitor, Smartphone, Clock, RefreshCw, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Client {
  email: string;
  name: string;
  balance: string;
  status: string;
  statusColor: string;
  date: string;
  blocked: boolean;
  card?: string;
  sessions: { ip: string; device: string; time: string }[];
}

const initialClients: Client[] = [
  { email: "koltunov.1978@list.ru", name: "Колтунов Павел", balance: "₽ 787 663,00", status: "Активен", statusColor: "text-primary", date: "14.02.2026", blocked: false, card: "Standard", sessions: [{ ip: "185.220.101.34", device: "Windows / Chrome", time: "16.02.2026, 14:23" }] },
  { email: "tory_york@mail.ru", name: "Владимир Анатольевич Гончаров", balance: "₽ 21 096 779,00", status: "Заблокирован", statusColor: "text-destructive", date: "16.02.2026", blocked: true, card: "Gold", sessions: [{ ip: "94.25.170.12", device: "iPhone / Safari", time: "16.02.2026, 12:01" }, { ip: "94.25.170.12", device: "iPad / Safari", time: "15.02.2026, 09:44" }] },
  { email: "yuriyzhuravlev2018@gmail.com", name: "Chargeback", balance: "₽ 124 350,00", status: "Активен", statusColor: "text-primary", date: "14.02.2026", blocked: false, sessions: [{ ip: "77.88.55.60", device: "Android / Chrome", time: "16.02.2026, 15:58" }] },
];

const AdminTab = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState<{ index: number; name: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [balanceEdit, setBalanceEdit] = useState<{ index: number; amount: string; mode: "add" | "sub" } | null>(null);
  const [cardAssign, setCardAssign] = useState<{ index: number; type: string } | null>(null);
  const [sessionsView, setSessionsView] = useState<{ index: number } | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    if (!sortField) return 0;
    let valA = "", valB = "";
    switch (sortField) {
      case "email": valA = a.email; valB = b.email; break;
      case "name": valA = a.name; valB = b.name; break;
      case "balance": valA = a.balance; valB = b.balance; break;
      case "status": valA = a.status; valB = b.status; break;
      case "date": valA = a.date; valB = b.date; break;
    }
    const cmp = valA.localeCompare(valB, "ru");
    return sortAsc ? cmp : -cmp;
  });

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const existingEmails = new Set(initialClients.map(c => c.email));
        const dbClients: Client[] = data
          .filter(p => !existingEmails.has(p.display_name ?? ""))
          .map(p => ({
            email: p.display_name?.includes("@") ? p.display_name : `user-${p.user_id.slice(0, 8)}`,
            name: p.display_name ?? "Без имени",
            balance: "₽ 0,00",
            status: "Активен",
            statusColor: "text-primary",
            date: new Date(p.created_at).toLocaleDateString("ru-RU"),
            blocked: false,
            sessions: [],
          }));

        const mergedEmails = new Set(initialClients.map(c => c.email));
        const newFromDB = dbClients.filter(c => !mergedEmails.has(c.email));
        setClients([...initialClients, ...newFromDB]);
      }
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleDelete = (index: number) => {
    setClients(prev => prev.filter((_, i) => i !== index));
    toast({ title: t("Информация"), description: "Клиент удалён" });
  };

  const handleBlock = (index: number) => {
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, blocked: !c.blocked, status: c.blocked ? "Активен" : "Заблокирован", statusColor: c.blocked ? "text-primary" : "text-destructive" } : c
    ));
  };

  const handleSaveName = () => {
    if (!editingName) return;
    setClients(prev => prev.map((c, i) => i === editingName.index ? { ...c, name: editingName.name } : c));
    setEditingName(null);
    toast({ title: t("Информация"), description: "Имя обновлено" });
  };

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.name) return;
    const client: Client = {
      email: newUser.email, name: newUser.name, balance: "₽ 0,00",
      status: "Активен", statusColor: "text-primary",
      date: new Date().toLocaleDateString("ru-RU"), blocked: false,
      sessions: [],
    };
    setClients(prev => [...prev, client]);
    setNewUser({ email: "", name: "", password: "" });
    setCreateOpen(false);
    toast({ title: t("Информация"), description: "Пользователь создан" });
  };

  const handleBalanceChange = () => {
    if (!balanceEdit) return;
    const amount = parseFloat(balanceEdit.amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount)) return;
    setClients(prev => prev.map((c, i) => {
      if (i !== balanceEdit.index) return c;
      const current = parseFloat(c.balance.replace(/[₽\s]/g, "").replace(/\s/g, "").replace(",", "."));
      const newBal = balanceEdit.mode === "add" ? current + amount : current - amount;
      return { ...c, balance: `₽ ${newBal.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}` };
    }));
    setBalanceEdit(null);
    toast({ title: t("Информация"), description: "Баланс обновлён" });
  };

  const handleAssignCard = () => {
    if (!cardAssign) return;
    setClients(prev => prev.map((c, i) => i === cardAssign.index ? { ...c, card: cardAssign.type } : c));
    setCardAssign(null);
    toast({ title: t("Информация"), description: "Карта назначена" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t("Панель администратора")}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{t("Полное управление клиентами и финансами")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <UserPlus className="w-4 h-4" />
                {t("Создать пользователя")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("Создать пользователя")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder={t("Имя")} value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder={t("Email")} type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                <Input placeholder={t("Пароль")} type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("Отмена")}</Button>
                <Button onClick={handleCreateUser}>{t("Создать")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={fetchRegistrations} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("Обновить")}
          </Button>
        </div>
      </div>

      {/* Balance edit dialog */}
      <Dialog open={!!balanceEdit} onOpenChange={open => !open && setBalanceEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{balanceEdit?.mode === "add" ? "Добавить" : "Списать"} средства</DialogTitle></DialogHeader>
          <Input placeholder="Сумма" value={balanceEdit?.amount ?? ""} onChange={e => setBalanceEdit(prev => prev ? { ...prev, amount: e.target.value } : null)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceEdit(null)}>{t("Отмена")}</Button>
            <Button onClick={handleBalanceChange}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit name dialog */}
      <Dialog open={!!editingName} onOpenChange={open => !open && setEditingName(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Редактировать имя")}</DialogTitle></DialogHeader>
          <Input value={editingName?.name ?? ""} onChange={e => setEditingName(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingName(null)}>{t("Отмена")}</Button>
            <Button onClick={handleSaveName}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card assign dialog */}
      <Dialog open={!!cardAssign} onOpenChange={open => !open && setCardAssign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Назначить карту</DialogTitle></DialogHeader>
          <Select value={cardAssign?.type ?? ""} onValueChange={val => setCardAssign(prev => prev ? { ...prev, type: val } : null)}>
            <SelectTrigger><SelectValue placeholder="Выберите тип карты" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard — 14 999 ₽</SelectItem>
              <SelectItem value="Gold">Gold — 24 999 ₽</SelectItem>
              <SelectItem value="Platinum">Platinum — 49 999 ₽</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCardAssign(null)}>{t("Отмена")}</Button>
            <Button onClick={handleAssignCard}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions dialog */}
      <Dialog open={!!sessionsView} onOpenChange={open => !open && setSessionsView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Сессии")} — {sessionsView !== null ? clients[sessionsView.index]?.name : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {sessionsView !== null && clients[sessionsView.index]?.sessions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                {s.device.includes("iPhone") || s.device.includes("Android") ? <Smartphone className="w-4 h-4 text-muted-foreground mt-0.5" /> : <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />}
                <div className="text-sm">
                  <p className="text-foreground font-medium">{s.device}</p>
                  <p className="text-muted-foreground text-xs">IP: {s.ip}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</p>
                </div>
              </div>
            ))}
            {sessionsView !== null && clients[sessionsView.index]?.sessions.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Нет активных сессий</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-4">{t("Клиенты")} ({clients.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                {["email", "name", "balance", "status", "date"].map(field => (
                  <th key={field} className="text-left pb-3 font-medium">
                    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      {t(field === "email" ? "Email" : field === "name" ? "Имя" : field === "balance" ? "Баланс" : field === "status" ? "Статус" : "Дата")}
                      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : ""}`} />
                    </button>
                  </th>
                ))}
                <th className="text-right pb-3 font-medium">{t("Действия")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client, i) => {
                const originalIndex = clients.indexOf(client);
                return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{client.email}</td>
                  <td className="py-3 text-foreground">
                    <button onClick={() => setEditingName({ index: originalIndex, name: client.name })} className="hover:text-primary hover:underline transition-colors">
                      {client.name}
                    </button>
                  </td>
                  <td className="py-3 text-foreground font-medium">{client.balance}</td>
                  <td className="py-3">
                    <span className={`${client.statusColor} text-xs font-medium`}>{t(client.status)}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{client.date}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button onClick={() => setBalanceEdit({ index: originalIndex, amount: "", mode: "add" })} className="p-1 text-muted-foreground hover:text-foreground" title="Добавить">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <button onClick={() => setBalanceEdit({ index: originalIndex, amount: "", mode: "sub" })} className="p-1 text-muted-foreground hover:text-foreground" title="Списать">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => setCardAssign({ index: originalIndex, type: client.card ?? "" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {client.card ?? t("Карта")}
                      </button>
                      <button onClick={() => toast({ title: t("Информация"), description: "Операция выполнена" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Send className="w-3 h-3" /> {t("Операция")}
                      </button>
                      <button
                        onClick={() => handleBlock(originalIndex)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium ${client.blocked ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}
                      >
                        {client.blocked ? t("Разбл.") : t("Блок.")}
                      </button>
                      <button onClick={() => setSessionsView({ index: originalIndex })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> {t("Сессии")}
                      </button>
                      <button onClick={() => toast({ title: t("Информация"), description: `${client.email} — ${client.balance}` })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button onClick={() => toast({ title: t("Операции"), description: "Последних операций: 9" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        {t("Операции")}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 text-xs px-2 py-1 rounded bg-destructive/20 text-destructive font-medium flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> {t("Удалить")}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("Подтвердите удаление")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("Вы уверены, что хотите удалить этого клиента?")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("Отмена")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(originalIndex)}>{t("Удалить")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
