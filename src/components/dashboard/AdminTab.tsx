import { Shield, UserPlus, CreditCard, Send, MessageSquare, Trash2, Monitor, Smartphone, Clock, RefreshCw, ArrowUpDown, Globe, Ban, Edit, DollarSign, Eye, Lock, Unlock, FileWarning, KeyRound, Scale } from "lucide-react";
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
  lastIp: string;
  blocked: boolean;
  cards: string[];
  blockedCards: string[];
  sessions: { ip: string; device: string; time: string }[];
  withdrawalBlocked: boolean;
  cardPrices: Record<string, string> | null;
  documentRequested: boolean;
  limitExceeded: boolean;
  compliancePrices: Record<string, string> | null;
}

const DEFAULT_CARD_PRICES: Record<string, string> = {
  White: "14 999 ₽",
  Silver: "24 999 ₽",
  Gold: "49 999 ₽",
  Diamond: "99 999 ₽",
};

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  card_name: string;
  created_at: string;
}

const AdminTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState<{ index: number; name: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [cardAssign, setCardAssign] = useState<{ index: number; type: string } | null>(null);
  const [sessionsView, setSessionsView] = useState<{ index: number; sessions: { ip: string; device: string; time: string }[] } | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [priceDialog, setPriceDialog] = useState<{ index: number; prices: Record<string, string> } | null>(null);
  const [txViewDialog, setTxViewDialog] = useState<{ index: number; transactions: Transaction[] } | null>(null);
  const [editTx, setEditTx] = useState<{ txId: string; title: string; amount: string; created_at: string } | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<{ index: number; password: string } | null>(null);
  const [compliancePriceDialog, setCompliancePriceDialog] = useState<{
    assisted_price: string;
    full_price: string;
    gold_discount: string;
    platinum_discount: string;
    diamond_discount: string;
  } | null>(null);
  const [clientComplianceDialog, setClientComplianceDialog] = useState<{
    index: number;
    assisted_price: string;
    full_price: string;
    gold_discount: string;
    platinum_discount: string;
    diamond_discount: string;
  } | null>(null);

  const [txDialog, setTxDialog] = useState<{
    index: number;
    mode: "add" | "sub";
    amount: string;
    comment: string;
    sender: string;
    cardName: string;
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
        .select("user_id, display_name, email, phone, created_at, is_blocked, cards, blocked_cards, last_sign_in_at, last_sign_in_ip, withdrawal_blocked, card_prices, document_requested, compliance_prices, limit_exceeded")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const dbClients: Client[] = data.map((p: any) => ({
          userId: p.user_id,
          email: p.email ?? `user-${p.user_id.slice(0, 8)}`,
          phone: p.phone ?? "—",
          name: p.display_name ?? "Без имени",
          balance: "₽ 0,00",
          status: p.is_blocked ? "Заблокирован" : "Активен",
          statusColor: p.is_blocked ? "text-destructive" : "text-primary",
          registrationDate: new Date(p.created_at).toLocaleDateString("ru-RU"),
          lastLogin: p.last_sign_in_at
            ? new Date(p.last_sign_in_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—",
          lastIp: p.last_sign_in_ip ?? "—",
          blocked: p.is_blocked,
          cards: p.cards ?? [],
          blockedCards: p.blocked_cards ?? [],
          sessions: [],
          withdrawalBlocked: p.withdrawal_blocked ?? false,
          cardPrices: p.card_prices ?? null,
          documentRequested: p.document_requested ?? false,
          limitExceeded: p.limit_exceeded ?? false,
          compliancePrices: p.compliance_prices ?? null,
        }));

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

  const handleDelete = async (index: number) => {
    const client = clients[index];
    if (client.userId) {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "delete_user", user_id: client.userId },
      });
      if (error || data?.error) {
        toast({ title: "Ошибка", description: data?.error || error?.message || "Не удалось удалить", variant: "destructive" });
        return;
      }
    }
    setClients(prev => prev.filter((_, i) => i !== index));
    toast({ title: t("Информация"), description: "Клиент и учётная запись полностью удалены" });
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

  const handleToggleWithdrawal = async (index: number) => {
    const client = clients[index];
    const newVal = !client.withdrawalBlocked;
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, withdrawalBlocked: newVal } : c
    ));
    if (client.userId) {
      await supabase.from("profiles").update({ withdrawal_blocked: newVal } as any).eq("user_id", client.userId);
    }
    toast({ title: "Успешно", description: newVal ? "Вывод заблокирован" : "Вывод разблокирован" });
  };

  const handleToggleDocRequest = async (index: number) => {
    const client = clients[index];
    const newVal = !client.documentRequested;
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, documentRequested: newVal } : c
    ));
    if (client.userId) {
      await supabase.from("profiles").update({ document_requested: newVal } as any).eq("user_id", client.userId);
    }
    toast({ title: "Успешно", description: newVal ? "Запрос документов включён" : "Запрос документов отключён" });
  };

  const handleToggleLimitExceeded = async (index: number) => {
    const client = clients[index];
    const newVal = !client.limitExceeded;
    setClients(prev => prev.map((c, i) =>
      i === index ? { ...c, limitExceeded: newVal } : c
    ));
    if (client.userId) {
      await supabase.from("profiles").update({ limit_exceeded: newVal } as any).eq("user_id", client.userId);
    }
    toast({ title: "Успешно", description: newVal ? "Статус «Превышен лимит» включён" : "Статус «Превышен лимит» отключён" });
  };

  const handleToggleCardBlock = async (index: number, cardName: string) => {
    const client = clients[index];
    const isBlocked = client.blockedCards.includes(cardName);
    const newBlockedCards = isBlocked
      ? client.blockedCards.filter(c => c !== cardName)
      : [...client.blockedCards, cardName];

    setClients(prev => prev.map((c, i) => i === index ? { ...c, blockedCards: newBlockedCards } : c));
    if (client.userId) {
      await supabase.from("profiles").update({ blocked_cards: newBlockedCards } as any).eq("user_id", client.userId);
    }
    toast({ title: "Успешно", description: isBlocked ? `Карта ${cardName} разблокирована` : `Карта ${cardName} заблокирована` });
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

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast({ title: "Ошибка", description: "Заполните все поля (имя, email, пароль)", variant: "destructive" });
      return;
    }
    setCreateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: {
          action: "create_user",
          email: newUser.email,
          password: newUser.password,
          display_name: newUser.name,
        },
      });

      if (error || data?.error) {
        toast({ title: "Ошибка", description: data?.error || error?.message || "Не удалось создать пользователя", variant: "destructive" });
        return;
      }

      setNewUser({ email: "", name: "", password: "" });
      setCreateOpen(false);
      toast({ title: "Успешно", description: "Пользователь создан" });
      fetchRegistrations();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordDialog || !passwordDialog.password) return;
    const client = clients[passwordDialog.index];
    if (!client.userId) return;

    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: {
        action: "change_password",
        user_id: client.userId,
        new_password: passwordDialog.password,
      },
    });

    if (error || data?.error) {
      toast({ title: "Ошибка", description: data?.error || error?.message || "Не удалось сменить пароль", variant: "destructive" });
      return;
    }

    setPasswordDialog(null);
    toast({ title: "Успешно", description: `Пароль изменён — ${client.name}` });
  };

  const handleTransaction = async () => {
    if (!txDialog) return;
    const amount = parseFloat(txDialog.amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Ошибка", description: "Введите корректную сумму", variant: "destructive" });
      return;
    }
    // Карта не обязательна — допускается зачисление/списание прямо на счёт без карты

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
      card_name: txDialog.cardName || "",
    });

    if (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить операцию: " + error.message, variant: "destructive" });
      return;
    }

    setClients(prev => prev.map((c, i) => {
      if (i !== txDialog.index) return c;
      const current = parseFloat(c.balance.replace(/[₽\s]/g, "").replace(/\u00a0/g, "").replace(",", ".")) || 0;
      const newBal = current + finalAmount;
      return { ...c, balance: `₽ ${newBal.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}` };
    }));

    toast({
      title: "Успешно",
      description: `${txDialog.mode === "add" ? "Зачислено" : "Списано"} ${amount.toLocaleString("ru-RU")} ₽ — ${client.name}${txDialog.cardName ? ` (${txDialog.cardName})` : ""}`,
    });
    setTxDialog(null);
  };

  const handleAssignCard = async () => {
    if (!cardAssign) return;
    const client = clients[cardAssign.index];
    // Принцип одной карты: новая карта заменяет предыдущую. Баланс единый (общие транзакции).
    const newCards = [cardAssign.type];
    const newBlocked: string[] = [];

    setClients(prev => prev.map((c, i) => i === cardAssign.index ? { ...c, cards: newCards, blockedCards: newBlocked } : c));
    if (client.userId) {
      await supabase.from("profiles").update({ cards: newCards, blocked_cards: newBlocked } as any).eq("user_id", client.userId);
      // Переносим все транзакции клиента на новую карту, чтобы баланс был единым
      await supabase.from("transactions").update({ card_name: cardAssign.type } as any).eq("user_id", client.userId);
    }
    setCardAssign(null);
    toast({ title: t("Информация"), description: `Карта клиента ${client.name} установлена: ${cardAssign.type}` });
  };

  const handleSavePrices = async () => {
    if (!priceDialog) return;
    const client = clients[priceDialog.index];
    setClients(prev => prev.map((c, i) => i === priceDialog.index ? { ...c, cardPrices: priceDialog.prices } : c));
    if (client.userId) {
      await supabase.from("profiles").update({ card_prices: priceDialog.prices } as any).eq("user_id", client.userId);
    }
    setPriceDialog(null);
    toast({ title: "Успешно", description: `Цены карт обновлены — ${client.name}` });
  };

  const handleViewSessions = async (index: number) => {
    const client = clients[index];
    if (!client.userId) return;

    const { data } = await supabase
      .from("login_sessions")
      .select("ip_address, user_agent, created_at")
      .eq("user_id", client.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const sessions = (data ?? []).map((s: any) => {
      const ua = s.user_agent || "";
      let device = "Неизвестно";
      if (/iPhone/i.test(ua)) device = "iPhone";
      else if (/Android/i.test(ua)) device = "Android";
      else if (/Windows/i.test(ua)) device = "Windows PC";
      else if (/Mac/i.test(ua)) device = "MacOS";
      else if (/Linux/i.test(ua)) device = "Linux";

      return {
        ip: s.ip_address ?? "—",
        device,
        time: new Date(s.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      };
    });

    setSessionsView({ index, sessions });
  };

  const handleViewTransactions = async (index: number) => {
    const client = clients[index];
    if (!client.userId) return;

    const { data } = await supabase
      .from("transactions")
      .select("id, title, category, amount, card_name, created_at")
      .eq("user_id", client.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    setTxViewDialog({ index, transactions: (data as any) ?? [] });
  };

  const handleUpdateTransaction = async () => {
    if (!editTx) return;
    const amount = parseFloat(editTx.amount.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount)) {
      toast({ title: "Ошибка", description: "Некорректная сумма", variant: "destructive" });
      return;
    }

    const updateData: any = { title: editTx.title, amount };
    if (editTx.created_at) {
      updateData.created_at = new Date(editTx.created_at).toISOString();
    }

    const { error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", editTx.txId);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    if (txViewDialog) {
      setTxViewDialog({
        ...txViewDialog,
        transactions: txViewDialog.transactions.map(tx =>
          tx.id === editTx.txId ? { ...tx, title: editTx.title, amount, created_at: editTx.created_at ? new Date(editTx.created_at).toISOString() : tx.created_at } : tx
        ),
      });
    }

    setEditTx(null);
    toast({ title: "Успешно", description: "Операция обновлена" });
    fetchRegistrations();
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
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full flex items-center gap-1.5">
              <UserPlus className="w-3 h-3" /> Всего регистраций: <span className="text-foreground font-semibold">{clients.length}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
                <Button onClick={handleCreateUser} disabled={createLoading}>{createLoading ? "Создание..." : t("Создать")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={async () => {
            const { data } = await supabase
              .from("compliance_settings" as any)
              .select("assisted_price, full_price, gold_discount, platinum_discount, diamond_discount")
              .limit(1)
              .single();
            if (data) {
              const d = data as any;
              setCompliancePriceDialog({
                assisted_price: d.assisted_price,
                full_price: d.full_price,
                gold_discount: String(d.gold_discount),
                platinum_discount: String(d.platinum_discount),
                diamond_discount: String(d.diamond_discount),
              });
            } else {
              setCompliancePriceDialog({
                assisted_price: "24 999 ₽",
                full_price: "44 999 ₽",
                gold_discount: "10",
                platinum_discount: "15",
                diamond_discount: "25",
              });
            }
          }} className="gap-2">
            <FileWarning className="w-4 h-4" />
            Цены комплаенс
          </Button>
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
              <Button variant={txDialog?.mode === "add" ? "default" : "outline"} className="flex-1" onClick={() => setTxDialog(prev => prev ? { ...prev, mode: "add" } : null)}>Зачислить</Button>
              <Button variant={txDialog?.mode === "sub" ? "default" : "outline"} className="flex-1" onClick={() => setTxDialog(prev => prev ? { ...prev, mode: "sub" } : null)}>Списать</Button>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Сумма ₽</Label>
              <Input placeholder="10 000" value={txDialog?.amount ?? ""} onChange={e => setTxDialog(prev => prev ? { ...prev, amount: e.target.value } : null)} type="number" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">От кого / Кому</Label>
              <Input placeholder="Например: ООО Ромашка" value={txDialog?.sender ?? ""} onChange={e => setTxDialog(prev => prev ? { ...prev, sender: e.target.value } : null)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Карта</Label>
              <Select value={txDialog?.cardName || "__none__"} onValueChange={val => setTxDialog(prev => prev ? { ...prev, cardName: val === "__none__" ? "" : val } : null)}>
                <SelectTrigger><SelectValue placeholder="Без карты (на счёт)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без карты (на счёт)</SelectItem>
                  {txDialog && clients[txDialog.index]?.cards.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Комментарий</Label>
              <Textarea placeholder="Пополнение баланса, возврат средств и т.д." value={txDialog?.comment ?? ""} onChange={e => setTxDialog(prev => prev ? { ...prev, comment: e.target.value } : null)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialog(null)}>{t("Отмена")}</Button>
            <Button onClick={handleTransaction}>{txDialog?.mode === "add" ? "Зачислить" : "Списать"}</Button>
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

      {/* Password change dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={open => !open && setPasswordDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Сменить пароль — {passwordDialog !== null ? clients[passwordDialog.index]?.name : ""}</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Новый пароль</Label>
            <Input type="password" placeholder="Минимум 6 символов" value={passwordDialog?.password ?? ""} onChange={e => setPasswordDialog(prev => prev ? { ...prev, password: e.target.value } : null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>{t("Отмена")}</Button>
            <Button onClick={handleChangePassword} disabled={!passwordDialog?.password || (passwordDialog?.password?.length ?? 0) < 6}>Сменить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card management dialog */}
      <Dialog open={!!cardAssign} onOpenChange={open => !open && setCardAssign(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Карта клиента — {cardAssign !== null ? clients[cardAssign.index]?.name : ""}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                У клиента может быть только одна карта. Выбор новой карты заменит текущую, баланс сохранится.
              </Label>
              <div className="flex gap-2">
                <Select value={cardAssign?.type ?? ""} onValueChange={val => setCardAssign(prev => prev ? { ...prev, type: val } : null)}>
                  <SelectTrigger><SelectValue placeholder="Выберите тип карты" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignCard} disabled={!cardAssign?.type} size="sm">Установить</Button>
              </div>
            </div>

            {cardAssign && clients[cardAssign.index]?.cards.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Текущая карта:</p>
                <div className="space-y-3">
                  {clients[cardAssign.index].cards.map(c => {
                    const isCardBlocked = clients[cardAssign.index].blockedCards.includes(c);
                    return (
                      <div key={c} className="p-3 bg-secondary rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${c === "Gold" ? "text-[hsl(35,80%,50%)]" : c === "Silver" ? "text-[hsl(210,20%,70%)]" : c === "Diamond" ? "text-[hsl(195,80%,60%)]" : "text-foreground"}`}>{c}</span>
                          <button
                            onClick={() => handleToggleCardBlock(cardAssign.index, c)}
                            className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${isCardBlocked ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}
                          >
                            {isCardBlocked ? <><Lock className="w-3 h-3" /> Заблокирована</> : <><Unlock className="w-3 h-3" /> Активна</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Card prices dialog with sale prices */}
      <Dialog open={!!priceDialog} onOpenChange={open => !open && setPriceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Цены карт — {priceDialog !== null ? clients[priceDialog.index]?.name : ""}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {["White", "Silver", "Gold", "Diamond"].map(cardType => (
              <div key={cardType} className="p-3 bg-secondary rounded-lg space-y-2">
                <p className="text-foreground font-medium text-sm">{cardType}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Цена</Label>
                    <Input
                      value={priceDialog?.prices[cardType] ?? DEFAULT_CARD_PRICES[cardType]}
                      onChange={e => setPriceDialog(prev => prev ? { ...prev, prices: { ...prev.prices, [cardType]: e.target.value } } : null)}
                      placeholder={DEFAULT_CARD_PRICES[cardType]}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Акция (перечёркнутая)</Label>
                    <Input
                      value={priceDialog?.prices[`${cardType}_sale`] ?? ""}
                      onChange={e => setPriceDialog(prev => prev ? { ...prev, prices: { ...prev.prices, [`${cardType}_sale`]: e.target.value } } : null)}
                      placeholder="Не установлена"
                    />
                  </div>
                </div>
                {priceDialog?.prices[`${cardType}_sale`] && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Превью:</span>
                    <span className="line-through text-muted-foreground">{priceDialog?.prices[cardType] ?? DEFAULT_CARD_PRICES[cardType]}</span>
                    <span className="text-primary font-bold">{priceDialog?.prices[`${cardType}_sale`]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialog(null)}>{t("Отмена")}</Button>
            <Button onClick={handleSavePrices}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions dialog */}
      <Dialog open={!!sessionsView} onOpenChange={open => !open && setSessionsView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("Сессии")} — {sessionsView !== null ? clients[sessionsView.index]?.name : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessionsView?.sessions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                {s.device === "iPhone" || s.device === "Android" ? <Smartphone className="w-4 h-4 text-muted-foreground mt-0.5" /> : <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />}
                <div className="text-sm">
                  <p className="text-foreground font-medium">{s.device}</p>
                  <p className="text-muted-foreground text-xs">IP: {s.ip}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</p>
                </div>
              </div>
            ))}
            {sessionsView?.sessions.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Нет активных сессий</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View transactions dialog */}
      <Dialog open={!!txViewDialog} onOpenChange={open => !open && setTxViewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Операции — {txViewDialog !== null ? clients[txViewDialog.index]?.name : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {txViewDialog?.transactions.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Нет операций</p>
            )}
            {txViewDialog?.transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tx.category}</span>
                    {tx.card_name && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{tx.card_name}</span>}
                    <span>{new Date(tx.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <p className={`text-sm font-medium shrink-0 ${tx.amount >= 0 ? "text-primary" : "text-foreground"}`}>
                  {tx.amount >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString("ru-RU")} ₽
                </p>
                <button
                  onClick={() => setEditTx({ txId: tx.id, title: tx.title, amount: String(tx.amount), created_at: new Date(tx.created_at).toISOString().slice(0, 16) })}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  title="Редактировать"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit transaction dialog */}
      <Dialog open={!!editTx} onOpenChange={open => !open && setEditTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Редактировать операцию</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Название</Label>
              <Input value={editTx?.title ?? ""} onChange={e => setEditTx(prev => prev ? { ...prev, title: e.target.value } : null)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Сумма</Label>
              <Input type="number" value={editTx?.amount ?? ""} onChange={e => setEditTx(prev => prev ? { ...prev, amount: e.target.value } : null)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Дата и время</Label>
              <Input type="datetime-local" value={editTx?.created_at ?? ""} onChange={e => setEditTx(prev => prev ? { ...prev, created_at: e.target.value } : null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>{t("Отмена")}</Button>
            <Button onClick={handleUpdateTransaction}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance prices dialog */}
      <Dialog open={!!compliancePriceDialog} onOpenChange={open => !open && setCompliancePriceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Цены комплаенс-услуг</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Цена «С поддержкой банка»</Label>
              <Input value={compliancePriceDialog?.assisted_price ?? ""} onChange={e => setCompliancePriceDialog(prev => prev ? { ...prev, assisted_price: e.target.value } : null)} placeholder="24 999 ₽" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Цена «Полное сопровождение»</Label>
              <Input value={compliancePriceDialog?.full_price ?? ""} onChange={e => setCompliancePriceDialog(prev => prev ? { ...prev, full_price: e.target.value } : null)} placeholder="44 999 ₽" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Gold скидка %</Label>
                <Input type="number" value={compliancePriceDialog?.gold_discount ?? ""} onChange={e => setCompliancePriceDialog(prev => prev ? { ...prev, gold_discount: e.target.value } : null)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Platinum %</Label>
                <Input type="number" value={compliancePriceDialog?.platinum_discount ?? ""} onChange={e => setCompliancePriceDialog(prev => prev ? { ...prev, platinum_discount: e.target.value } : null)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Diamond %</Label>
                <Input type="number" value={compliancePriceDialog?.diamond_discount ?? ""} onChange={e => setCompliancePriceDialog(prev => prev ? { ...prev, diamond_discount: e.target.value } : null)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompliancePriceDialog(null)}>{t("Отмена")}</Button>
            <Button onClick={async () => {
              if (!compliancePriceDialog) return;
              const { error } = await supabase
                .from("compliance_settings" as any)
                .update({
                  assisted_price: compliancePriceDialog.assisted_price,
                  full_price: compliancePriceDialog.full_price,
                  gold_discount: parseInt(compliancePriceDialog.gold_discount) || 0,
                  platinum_discount: parseInt(compliancePriceDialog.platinum_discount) || 0,
                  diamond_discount: parseInt(compliancePriceDialog.diamond_discount) || 0,
                } as any)
                .not("id", "is", null);
              if (error) {
                toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                return;
              }
              setCompliancePriceDialog(null);
              toast({ title: "Успешно", description: "Цены комплаенс-услуг обновлены" });
            }}>{t("Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-client compliance prices dialog */}
      <Dialog open={!!clientComplianceDialog} onOpenChange={open => !open && setClientComplianceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Комплаенс-цены — {clientComplianceDialog !== null ? clients[clientComplianceDialog.index]?.name : ""}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Индивидуальные цены для этого клиента. Оставьте пустым, чтобы использовать глобальные настройки.</p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Цена «С поддержкой банка»</Label>
              <Input value={clientComplianceDialog?.assisted_price ?? ""} onChange={e => setClientComplianceDialog(prev => prev ? { ...prev, assisted_price: e.target.value } : null)} placeholder="Глобальная" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Цена «Полное сопровождение»</Label>
              <Input value={clientComplianceDialog?.full_price ?? ""} onChange={e => setClientComplianceDialog(prev => prev ? { ...prev, full_price: e.target.value } : null)} placeholder="Глобальная" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Gold скидка %</Label>
                <Input type="number" value={clientComplianceDialog?.gold_discount ?? ""} onChange={e => setClientComplianceDialog(prev => prev ? { ...prev, gold_discount: e.target.value } : null)} placeholder="Глоб." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Platinum %</Label>
                <Input type="number" value={clientComplianceDialog?.platinum_discount ?? ""} onChange={e => setClientComplianceDialog(prev => prev ? { ...prev, platinum_discount: e.target.value } : null)} placeholder="Глоб." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Diamond %</Label>
                <Input type="number" value={clientComplianceDialog?.diamond_discount ?? ""} onChange={e => setClientComplianceDialog(prev => prev ? { ...prev, diamond_discount: e.target.value } : null)} placeholder="Глоб." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientComplianceDialog(null)}>{t("Отмена")}</Button>
            <Button variant="outline" size="sm" onClick={() => {
              if (!clientComplianceDialog) return;
              setClientComplianceDialog(prev => prev ? { ...prev, assisted_price: "", full_price: "", gold_discount: "", platinum_discount: "", diamond_discount: "" } : null);
            }}>Сбросить</Button>
            <Button onClick={async () => {
              if (!clientComplianceDialog) return;
              const client = clients[clientComplianceDialog.index];
              const hasAny = clientComplianceDialog.assisted_price || clientComplianceDialog.full_price || clientComplianceDialog.gold_discount || clientComplianceDialog.platinum_discount || clientComplianceDialog.diamond_discount;
              const prices = hasAny ? {
                ...(clientComplianceDialog.assisted_price ? { assisted_price: clientComplianceDialog.assisted_price } : {}),
                ...(clientComplianceDialog.full_price ? { full_price: clientComplianceDialog.full_price } : {}),
                ...(clientComplianceDialog.gold_discount ? { gold_discount: parseInt(clientComplianceDialog.gold_discount) } : {}),
                ...(clientComplianceDialog.platinum_discount ? { platinum_discount: parseInt(clientComplianceDialog.platinum_discount) } : {}),
                ...(clientComplianceDialog.diamond_discount ? { diamond_discount: parseInt(clientComplianceDialog.diamond_discount) } : {}),
              } : null;

              const { error } = await supabase.from("profiles").update({ compliance_prices: prices } as any).eq("user_id", client.userId);
              if (error) {
                toast({ title: "Ошибка", description: error.message, variant: "destructive" });
                return;
              }
              setClients(prev => prev.map((c, i) => i === clientComplianceDialog.index ? { ...c, compliancePrices: prices as any } : c));
              setClientComplianceDialog(null);
              toast({ title: "Успешно", description: prices ? `Индивидуальные комплаенс-цены установлены — ${client.name}` : `Используются глобальные цены — ${client.name}` });
            }}>{t("Сохранить")}</Button>
          </DialogFooter>
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
                <th className="text-left pb-3 font-medium text-xs uppercase">Карты</th>
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
                    <button onClick={() => setEditingName({ index: originalIndex, name: client.name })} className="hover:text-primary hover:underline transition-colors flex items-center gap-1">
                      {client.name}
                      <Edit className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </td>
                  <td className="py-3 text-foreground font-medium">{client.balance}</td>
                  <td className="py-3">
                    <span className={`${client.statusColor} text-xs font-medium`}>{t(client.status)}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{client.registrationDate}</td>
                  <td className="py-3 text-muted-foreground text-xs">{client.lastLogin}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {client.cards.map(c => {
                        const isCardBlocked = client.blockedCards.includes(c);
                        return (
                          <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isCardBlocked ? "bg-destructive/20 text-destructive line-through" : c === "Gold" ? "bg-[hsl(35,80%,50%)]/20 text-[hsl(35,80%,50%)]" : c === "Silver" ? "bg-[hsl(210,20%,70%)]/20 text-[hsl(210,20%,70%)]" : c === "Diamond" ? "bg-[hsl(195,80%,60%)]/20 text-[hsl(195,80%,60%)]" : "bg-muted text-muted-foreground"}`}>{c}</span>
                        );
                      })}
                      {client.cards.length === 0 && <span className="text-muted-foreground text-[10px]">—</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button onClick={() => setTxDialog({ index: originalIndex, mode: "add", amount: "", comment: "", sender: "", cardName: "" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1">
                        <DollarSign className="w-3 h-3" /> Операции
                      </button>
                      <button onClick={() => handleViewTransactions(originalIndex)} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1">
                        <Eye className="w-3 h-3" /> История
                      </button>
                      <button onClick={() => setCardAssign({ index: originalIndex, type: "" })} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1">
                        <CreditCard className="w-3 h-3" /> Карта
                      </button>
                      <button
                        onClick={() => {
                          const currentPrices = client.cardPrices ?? { ...DEFAULT_CARD_PRICES };
                          setPriceDialog({ index: originalIndex, prices: currentPrices });
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1"
                        title="Цены карт"
                      >
                        <DollarSign className="w-3 h-3" /> Цены
                      </button>
                      <button
                        onClick={() => setPasswordDialog({ index: originalIndex, password: "" })}
                        className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1"
                        title="Сменить пароль"
                      >
                        <KeyRound className="w-3 h-3" /> Пароль
                      </button>
                      <button
                        onClick={() => handleToggleWithdrawal(originalIndex)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${client.withdrawalBlocked ? 'bg-orange-600/20 text-orange-400' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        title={client.withdrawalBlocked ? "Разрешить вывод" : "Запретить вывод"}
                      >
                        <Ban className="w-3 h-3" /> {client.withdrawalBlocked ? "Вывод ⛔" : "Вывод ✓"}
                      </button>
                      <button
                        onClick={() => handleToggleDocRequest(originalIndex)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${client.documentRequested ? 'bg-[hsl(210,80%,50%)]/20 text-[hsl(210,80%,60%)]' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        title={client.documentRequested ? "Отменить запрос док." : "Запросить док."}
                      >
                        <FileWarning className="w-3 h-3" /> {client.documentRequested ? "Док. ⚠" : "Док. ✓"}
                      </button>
                      <button
                        onClick={() => handleToggleLimitExceeded(originalIndex)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${client.limitExceeded ? 'bg-[hsl(45,90%,55%)]/25 text-[hsl(40,95%,55%)]' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        title={client.limitExceeded ? "Снять «Превышен лимит»" : "Отметить «Превышен лимит»"}
                      >
                        <AlertTriangle className="w-3 h-3" /> {client.limitExceeded ? "Лимит ⚠" : "Лимит ✓"}
                      </button>
                      <button
                        onClick={() => {
                          const cp = client.compliancePrices ?? {};
                          setClientComplianceDialog({
                            index: originalIndex,
                            assisted_price: (cp as any).assisted_price ?? "",
                            full_price: (cp as any).full_price ?? "",
                            gold_discount: (cp as any).gold_discount != null ? String((cp as any).gold_discount) : "",
                            platinum_discount: (cp as any).platinum_discount != null ? String((cp as any).platinum_discount) : "",
                            diamond_discount: (cp as any).diamond_discount != null ? String((cp as any).diamond_discount) : "",
                          });
                        }}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium flex items-center gap-1 ${client.compliancePrices ? 'bg-[hsl(210,80%,50%)]/20 text-[hsl(210,80%,60%)]' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        title="Комплаенс-цены"
                      >
                        <Scale className="w-3 h-3" /> {client.compliancePrices ? "Комп. ✎" : "Комп."}
                      </button>
                      <button
                        onClick={() => handleBlock(originalIndex)}
                        className={`p-1.5 text-xs px-2 py-1 rounded font-medium ${client.blocked ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}
                      >
                        {client.blocked ? t("Разбл.") : t("Блок.")}
                      </button>
                      <button onClick={() => handleViewSessions(originalIndex)} className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 bg-secondary rounded px-2 py-1">
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
                            <AlertDialogTitle>{t("Полное удаление аккаунта")}</AlertDialogTitle>
                            <AlertDialogDescription>Будут удалены: учётная запись, профиль, все транзакции, обращения и файлы. Это действие необратимо.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("Отмена")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(originalIndex)}>{t("Удалить полностью")}</AlertDialogAction>
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
