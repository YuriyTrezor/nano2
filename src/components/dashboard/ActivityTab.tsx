import { useEffect, useState } from "react";
import { Activity, Trash2, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface AdminNotif {
  id: string;
  event_type: string;
  user_id: string | null;
  client_name: string | null;
  client_email: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  transfer: "Перевод",
  withdrawal: "Списание",
  conversion: "Конвертация",
};

const ActivityTab = () => {
  const [items, setItems] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_notifications" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-activity-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const markAllRead = async () => {
    const ids = items.filter(i => !i.is_read).map(i => i.id);
    if (!ids.length) return;
    await supabase.from("admin_notifications" as any).update({ is_read: true }).in("id", ids);
    setItems(prev => prev.map(i => ({ ...i, is_read: true })));
    toast({ title: "Готово", description: "Все события отмечены прочитанными" });
  };

  const removeOne = async (id: string) => {
    await supabase.from("admin_notifications" as any).delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clearAll = async () => {
    if (!confirm("Удалить всю историю активности?")) return;
    await supabase.from("admin_notifications" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setItems([]);
  };

  const filtered = items.filter(i => {
    if (typeFilter !== "all" && i.event_type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (i.client_name || "").toLowerCase().includes(q) ||
      (i.client_email || "").toLowerCase().includes(q) ||
      (i.title || "").toLowerCase().includes(q) ||
      (i.description || "").toLowerCase().includes(q)
    );
  });

  const unread = items.filter(i => !i.is_read).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Активность клиентов</h1>
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {unread} новых
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Все переводы, списания и заявки клиентов в реальном времени</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unread}>
            <Check className="w-4 h-4 mr-1" /> Прочитать всё
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={!items.length}>
            <Trash2 className="w-4 h-4 mr-1" /> Очистить
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск: имя, email, описание..."
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все события</SelectItem>
            <SelectItem value="transfer">Переводы</SelectItem>
            <SelectItem value="withdrawal">Списания</SelectItem>
            <SelectItem value="conversion">Конвертации</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Пока нет событий</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                <div className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 ${
                  n.event_type === "transfer" ? "bg-blue-500/10 text-blue-500" :
                  n.event_type === "withdrawal" ? "bg-destructive/10 text-destructive" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {TYPE_LABELS[n.event_type] || n.event_type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-semibold text-foreground">{n.client_name || "Клиент"}</p>
                    {n.client_email && <p className="text-xs text-muted-foreground truncate">{n.client_email}</p>}
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{n.title}</p>
                  {n.description && <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
                {n.amount != null && (
                  <div className={`text-right font-semibold shrink-0 ${Number(n.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                    {Number(n.amount).toLocaleString("ru-RU")} {n.currency || "RUB"}
                  </div>
                )}
                <button onClick={() => removeOne(n.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;