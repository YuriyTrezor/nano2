import { Shield, UserPlus, Plus, Minus, CreditCard, Send, Eye, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

interface Client {
  email: string;
  name: string;
  balance: string;
  status: string;
  statusColor: string;
  date: string;
  blocked: boolean;
}

const initialClients: Client[] = [
  { email: "koltunov.1978@list.ru", name: "Колтунов Павел", balance: "₽ 787 663,00", status: "Активен", statusColor: "text-primary", date: "14.02.2026", blocked: false },
  { email: "tory_york@mail.ru", name: "Владимир Анатольевич Гончаров", balance: "₽ 21 096 779,00", status: "Заблокирован", statusColor: "text-yellow-500", date: "16.02.2026", blocked: true },
  { email: "yuriyzhuravlev2018@gmail.com", name: "Chargeback", balance: "₽ 124 350,00", status: "Активен", statusColor: "text-primary", date: "14.02.2026", blocked: false },
];

const AdminTab = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [editingName, setEditingName] = useState<{ index: number; name: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [balanceEdit, setBalanceEdit] = useState<{ index: number; amount: string; mode: "add" | "sub" } | null>(null);

  const handleDelete = (index: number) => {
    setClients(prev => prev.filter((_, i) => i !== index));
    toast({ title: t("Информация"), description: "Клиент удалён" });
  };

  const handleBlock = (index: number) => {
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, blocked: !c.blocked, status: c.blocked ? "Активен" : "Заблокирован", statusColor: c.blocked ? "text-primary" : "text-yellow-500" } : c
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

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-4">{t("Клиенты")} ({clients.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left pb-3 font-medium">{t("Email")}</th>
                <th className="text-left pb-3 font-medium">{t("Имя")}</th>
                <th className="text-left pb-3 font-medium">{t("Баланс")}</th>
                <th className="text-left pb-3 font-medium">{t("Статус")}</th>
                <th className="text-left pb-3 font-medium">{t("Дата")}</th>
                <th className="text-right pb-3 font-medium">{t("Действия")}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{client.email}</td>
                  <td className="py-3 text-foreground">
                    <button onClick={() => setEditingName({ index: i, name: client.name })} className="hover:text-primary hover:underline transition-colors">
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
                      <button onClick={() => setBalanceEdit({ index: i, amount: "", mode: "add" })} className="p-1 text-muted-foreground hover:text-foreground" title="Добавить">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <button onClick={() => setBalanceEdit({ index: i, amount: "", mode: "sub" })} className="p-1 text-muted-foreground hover:text-foreground" title="Списать">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => toast({ title: t("Информация"), description: `Карта: **** 3891` })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {t("Карта")}
                      </button>
                      <button onClick={() => toast({ title: t("Информация"), description: "Операция выполнена" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Send className="w-3 h-3" /> {t("Операция")}
                      </button>
                      <button
                        onClick={() => handleBlock(i)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium ${client.blocked ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}
                      >
                        {client.blocked ? t("Разбл.") : t("Блок.")}
                      </button>
                      <button onClick={() => toast({ title: t("Сессии"), description: "Активных сессий: 1" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {t("Сессии")}
                      </button>
                      <button onClick={() => toast({ title: t("Информация"), description: `${client.email} — ${client.balance}` })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button onClick={() => toast({ title: t("Операции"), description: "Последних операций: 9" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        {t("Операции")}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 font-medium flex items-center gap-1">
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
                            <AlertDialogAction onClick={() => handleDelete(i)}>{t("Удалить")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
