import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, MapPin, User, Clock, Check, Package, Loader2 } from "lucide-react";

interface Props {
  cardName: string;
}

const SERVICE_LABELS: Record<string, string> = {
  neobank: "Курьерская доставка NeoBank",
  cdek: "СДЭК",
  boxberry: "Boxberry",
  post: "Почта России",
  yandex: "Яндекс Доставка",
  dpd: "DPD",
  "5post": "5Post (Пятёрочка)",
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Ожидается доставка", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: Clock },
  processing: { label: "В обработке", color: "text-primary bg-primary/10 border-primary/30", icon: Loader2 },
  shipped: { label: "В пути", color: "text-primary bg-primary/10 border-primary/30", icon: Truck },
  delivered: { label: "Доставлено", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", icon: Check },
  cancelled: { label: "Отменено", color: "text-destructive bg-destructive/10 border-destructive/30", icon: Package },
};

const CardOrdersHistory = ({ cardName }: Props) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("card_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("card_name", cardName)
        .order("created_at", { ascending: false });
      if (active) {
        setOrders(data || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, cardName]);

  if (loading) return <div className="text-xs text-muted-foreground py-2">Загрузка…</div>;
  if (orders.length === 0) return null;

  return (
    <div className="space-y-2 mt-1.5">
      <div className="px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Заявки на доставку</div>
      {orders.map((o) => {
        const status = STATUS_MAP[o.status] ?? STATUS_MAP.pending;
        const StatusIcon = status.icon;
        const date = new Date(o.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
        return (
          <div key={o.id} className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                <StatusIcon className="w-3 h-3" /> {status.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{date}</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-start gap-1.5">
                <Truck className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">
                  {SERVICE_LABELS[o.delivery_service] ?? o.delivery_service}
                  <span className="text-muted-foreground"> • {o.delivery_type === "courier" ? "Курьер" : "Пункт выдачи"}</span>
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  {o.country}{o.region ? `, ${o.region}` : ""}, {o.city}
                  <br />{o.address_line}{o.postal_code ? ` • ${o.postal_code}` : ""}
                  {o.pickup_point && <><br /><span className="text-foreground">ПВЗ: {o.pickup_point}</span></>}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <User className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  {o.full_name} • {o.phone}
                </span>
              </div>
              {o.comment && (
                <div className="text-[10px] text-muted-foreground italic pl-4.5 pt-1 border-t border-border/50">
                  «{o.comment}»
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardOrdersHistory;