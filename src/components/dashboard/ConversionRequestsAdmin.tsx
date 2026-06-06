import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, ArrowRight, Loader2 } from "lucide-react";

interface Req {
  id: string;
  user_id: string;
  amount_usd: number;
  rate: number;
  fee_percent: number;
  amount_rub: number;
  status: string;
  card_name: string;
  comment: string | null;
  created_at: string;
  processed_at: string | null;
}

interface ProfileLite { user_id: string; display_name: string | null; email: string | null; }

export default function ConversionRequestsAdmin() {
  const [items, setItems] = useState<Req[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conversion_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    const list = (data || []) as Req[];
    setItems(list);
    const ids = Array.from(new Set(list.map(r => r.user_id)));
    if (ids.length) {
      const { data: pr } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (pr || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (r: Req) => {
    if (processingId) return;
    setProcessingId(r.id);
    // Create two transactions: -USD and +RUB
    const { error: errDebit } = await supabase.from("transactions").insert({
      user_id: r.user_id,
      title: `Списание USD (конвертация в RUB): ${Number(r.amount_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
      category: "USD конвертация",
      amount: -Number(r.amount_usd),
      card_name: r.card_name || "",
    });
    if (errDebit) {
      setProcessingId(null);
      toast({ title: "Ошибка списания USD", description: errDebit.message, variant: "destructive" });
      return;
    }
    const { error: errCredit } = await supabase.from("transactions").insert({
      user_id: r.user_id,
      title: `Зачисление RUB от конвертации (${Number(r.amount_usd).toLocaleString("en-US")} USD × ${r.rate})`,
      category: "Конвертация",
      amount: Number(r.amount_rub),
      card_name: r.card_name || "",
    });
    if (errCredit) {
      setProcessingId(null);
      toast({ title: "Ошибка зачисления RUB", description: errCredit.message, variant: "destructive" });
      return;
    }
    const { error: errUpd } = await supabase
      .from("conversion_requests")
      .update({ status: "approved", processed_at: new Date().toISOString() })
      .eq("id", r.id);
    setProcessingId(null);
    if (errUpd) {
      toast({ title: "Транзакции созданы, но не удалось обновить заявку", description: errUpd.message, variant: "destructive" });
    } else {
      toast({ title: "Готово", description: "Конвертация выполнена" });
    }
    load();
  };

  const reject = async (r: Req) => {
    if (processingId) return;
    setProcessingId(r.id);
    const { error } = await supabase
      .from("conversion_requests")
      .update({ status: "rejected", processed_at: new Date().toISOString() })
      .eq("id", r.id);
    setProcessingId(null);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Заявка отклонена" });
    load();
  };

  const pending = items.filter(i => i.status === "pending");
  const processed = items.filter(i => i.status !== "pending");

  const renderRow = (r: Req) => {
    const p = profiles[r.user_id];
    return (
      <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-foreground">{p?.display_name || "—"}</div>
            <div className="text-xs text-muted-foreground">{p?.email || r.user_id}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(r.created_at).toLocaleString("ru-RU")}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-bold text-xs">
            − {Number(r.amount_usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs">
            + {Number(r.amount_rub).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} RUB
          </span>
          <span className="text-xs text-muted-foreground ml-1">курс 1 USD = {r.rate} RUB, комиссия {r.fee_percent}% (вне счёта)</span>
        </div>
        {r.comment && <div className="text-xs text-muted-foreground italic">«{r.comment}»</div>}
        {r.status === "pending" ? (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => approve(r)} disabled={processingId === r.id} className="gap-1">
              {processingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Подтвердить
            </Button>
            <Button size="sm" variant="outline" onClick={() => reject(r)} disabled={processingId === r.id} className="gap-1">
              <X className="w-3 h-3" />
              Отклонить
            </Button>
          </div>
        ) : (
          <div className={`text-xs font-semibold inline-block px-2 py-0.5 rounded ${r.status === "approved" ? "bg-green-600/15 text-green-500" : "bg-red-600/15 text-red-500"}`}>
            {r.status === "approved" ? "Подтверждено" : "Отклонено"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-foreground font-bold">Заявки на конвертацию USD → RUB</h3>
          <p className="text-xs text-muted-foreground">В ожидании: {pending.length}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      {pending.length === 0 && processed.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Заявок нет</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-5">
          {pending.map(renderRow)}
        </div>
      )}

      {processed.length > 0 && (
        <details>
          <summary className="text-sm text-muted-foreground cursor-pointer mb-3">История ({processed.length})</summary>
          <div className="space-y-3">
            {processed.map(renderRow)}
          </div>
        </details>
      )}
    </div>
  );
}