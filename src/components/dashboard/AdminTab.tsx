import { Shield, UserPlus, CreditCard, Send, MessageSquare, Trash2, Monitor, Smartphone, Clock, RefreshCw, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Label } from "@/components/ui/label";

interface Client {
  userId: string;
  email: string;
  phone: string;
  name: string;
  balance: string;
  status: string;
  statusColor: string;
  registrationDate: string;
  lastLogin: string;
  blocked: boolean;
  card?: string;
  sessions: { ip: string; device: string; time: string }[];
}

const AdminTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState<{ index: number; name: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [cardAssign, setCardAssign] = useState<{ index: number; type: string } | null>(null);
  const [sessionsView, setSessionsView] = useState<{ index: number } | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const [txDialog, setTxDialog] = useState<{
    index: number;
    mode: "add" | "sub";
    amount: string;
    comment: string;
    sender: string;
  } | null>(null);

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
      case "phone": valA = a.phone; valB = b.phone; break;
      case "name": valA = a.name; valB = b.name; break;
      case "balance": valA = a.balance; valB = b.balance; break;
      case "status": valA = a.status; valB = b.status; break;
      case "registrationDate": valA = a.registrationDate; valB = b.registrationDate; break;
      case "lastLogin": valA = a.lastLogin; valB = b.lastLogin; break;
    }
    const cmp = valA.localeCompare(valB, "ru");
    return sortAsc ? cmp : -cmp;
  });

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, phone, created_at, is_blocked, card_type")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const dbClients: Client[] = data.map(p => ({
          userId: p.user_id,
          email: p.email ?? `user-${p.user_id.slice(0, 8)}`,
          phone: p.phone ?? "—",
          name: p.display_name ?? "Без имени",
          balance: "₽ 0,00",
          status: p.is_blocked ? "Заблокирован" : "Активен",
          statusColor: p.is_blocked ? "text-destructive" : "text-primary",
          registrationDate: new Date(p.created_at).toLocaleDateString("ru-RU"),
          lastLogin: "—",
          blocked: p.is_blocked,
          card: (p as any).card_type ?? undefined,
          sessions: [],
        }));

        // Load balances from transactions
        for (const client of dbClients) {
          const { data: txData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", client.userId);
          if (txData && txData.length > 0) {
            const total = txData.reduce((sum, tx) => sum + Number(tx.amount), 0);
            client.balance = `₽ ${total.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}`;
          }
        }

        setClients(dbClients);
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

  const handleBlock = async (index: number) => {
    const client = clients[index];
    const newBlocked = !client.blocked;
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, blocked: newBlocked, status: newBlocked ? "Заблокирован" : "Активен", statusColor: newBlocked ? "text-destructive" : "text-primary" } : c
    ));
    if (client.userId) {
      await supabase.from("profiles").update({ is_blocked: newBlocked }).eq("user_id", client.userId);
    }
  };

  const handleSaveName = async () => {
    if (!editingName) return;
    const client = clients[editingName.index];
    setClients(prev => prev.map((c, i) => i === editingName.index ? { ...c, name: editingName.name } : c));
    if (client.userId) {
      await supabase.from("profiles").update({ display_name: editingName.name }).eq("user_id", client.userId);
    }
    setEditingName(null);
    toast({ title: t("Информация"), description: "Имя обновлено" });
  };

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.name) return;
    const client: Client = {
      userId: "", email: newUser.email, phone: "—", name: newUser.name, balance: "₽ 0,00",
      status: "Активен", statusColor: "text-primary",
      registrationDate: new Date().toLocaleDateString("ru-RU"), lastLogin: "—", blocked: false,
      sessions: [],
    };
    setClients(prev => [...prev, client]);
    setNewUser({ email: "", name: "", password: "" });
    setCreateOpen(false);
    toast({ title: t("Информация"), description: "Пользователь создан" });
  };

  const handleTransaction = async () => {
    if (!txDialog) return;
    const amount = parseFloat(txDialog.amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Ошибка", description: "Введите корректную сумму", variant: "destructive" });
      return;
    }

    const client = clients[txDialog.index];
    const finalAmount = txDialog.mode === "add" ? amount : -amount;
    const title = txDialog.mode === "add"
      ? `Пополнение${txDialog.sender ? ` от ${txDialog.sender}` : ""}${txDialog.comment ? `. ${txDialog.comment}` : ""}`
      : `Списание${txDialog.comment ? `: ${txDialog.comment}` : ""}`;
    const category = txDialog.mode === "add" ? "Пополнение" : "Списание";

    if (!client.userId) {
      toast({ title: "Ошибка", description: "У клиента нет привязки к аккаунту в БД", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: client.userId,
      title,
      category,
      amount: finalAmount,
    });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить операцию: " + error.message, variant: "destructive" });
      return;
    }

    // Update local balance
    setClients(prev => prev.map((c, i) => {
      if (i !== txDialog.index) return c;
      const current = parseFloat(c.balance.replace(/[₽\s]/g, "").replace(/\u00a0/g, "").replace(",", ".")) || 0;
      const newBal = current + finalAmount;
      return { ...c, balance: `₽ ${newBal.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}` };
    }));

    toast({
      title: "Успешно",
      description: `${txDialog.mode === "add" ? "Зачислено" : "Списано"} ${amount.toLocaleString("ru-RU")} ₽ — ${client.name}`,
    });
    setTxDialog(null);
  };

  const handleAssignCard = async () => {
    if (!cardAssign) return;
    const client = clients[cardAssign.index];
    setClients(prev => prev.map((c, i) => i === cardAssign.index ? { ...c, card: cardAssign.type } : c));
    if (client.userId) {
      await supabase.from("profiles").update({ card_type: cardAssign.type } as any).eq("user_id", client.userId);
    }
    setCardAssign(null);
    toast({ title: t("Информация"), description: `Карта ${cardAssign.type} назначена — ${client.name}` });
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

      {/* Transaction dialog */}
      <Dialog open={!!txDialog} onOpenChange={open => !open && setTxDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {txDialog?.mode === "add" ? "Зачисление средств" : "Списание средств"}
              {txDialog && ` — ${clients[txDialog.index]?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={txDialog?.mode === "add" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTxDialog(prev => prev ? { ...prev, mode: "add" } : null)}
              >
                Зачислить
              </Button>
              <Button
                variant={txDialog?.mode === "sub" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTxDialog(prev => prev ? { ...prev, mode: "sub" } : null)}
              >
                Списать
              </Button>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Сумма ₽</Label>
              <Input
                placeholder="10 000"
                value={txDialog?.amount ?? ""}
                onChange={e => setTxDialog(prev => prev ? { ...prev, amount: e.target.value } : null)}
                type="number"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">От кого / Кому</Label>
              <Input
                placeholder="Например: ООО Ромашка"
                value={txDialog?.sender ?? ""}
                onChange={e => setTxDialog(prev => prev ? { ...prev, sender: e.target.value } : null)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Комментарий</Label>
              <Textarea
                placeholder="Пополнение баланса, возврат средств и т.д."
                value={txDialog?.comment ?? ""}
                onChange={e => setTxDialog(prev => prev ? { ...prev, comment: e.target.value } : null)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog(null)}>{t("Отмена")}</Button>
            <Button onClick={handleTransaction}>
              {txDialog?.mode === "add" ? "Зачислить" : "Списать"}
            </Button>
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
                {["email", "phone", "name", "balance", "status", "registrationDate", "lastLogin"].map(field => (
                  <th key={field} className="text-left pb-3 font-medium">
                    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      {t(field === "email" ? "Email" : field === "phone" ? "Телефон" : field === "name" ? "Имя" : field === "balance" ? "Баланс" : field === "status" ? "Статус" : field === "registrationDate" ? "Регистрация" : "Посл. вход")}
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
                <tr key={client.userId || i} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground text-xs">{client.email}</td>
                  <td className="py-3 text-muted-foreground text-xs">{client.phone}</td>
                  <td className="py-3 text-foreground">
                    <button onClick={() => setEditingName({ index: originalIndex, name: client.name })} className="hover:text-primary hover:underline transition-colors">
                      {client.name}
                    </button>
                  </td>
                  <td className="py-3 text-foreground font-medium">{client.balance}</td>
                  <td className="py-3">
                    <span className={`${client.statusColor} text-xs font-medium`}>{t(client.status)}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{client.registrationDate}</td>
                  <td className="py-3 text-muted-foreground text-xs">{client.lastLogin}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => setTxDialog({ index: originalIndex, mode: "add", amount: "", comment: "", sender: "" })}
                        className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1"
                        title="Добавить / Списать средства"
                      >
                        <Send className="w-3 h-3" /> Операция
                      </button>
                      <button onClick={() => setCardAssign({ index: originalIndex, type: client.card ?? "" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1">
                        <CreditCard className="w-3 h-3" /> {client.card ?? t("Карта")}
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
