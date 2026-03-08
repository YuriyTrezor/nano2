import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Rate {
  code: string;
  symbol: string;
  value: number;
  change: number;
}

const CurrencyRatesWidget = ({ compact = false }: { compact?: boolean }) => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      const data = await res.json();
      const usd = data.Valute.USD;
      const eur = data.Valute.EUR;
      const cny = data.Valute.CNY;
      const gbp = data.Valute.GBP;

      setRates([
        { code: "USD", symbol: "$", value: usd.Value, change: usd.Value - usd.Previous },
        { code: "EUR", symbol: "€", value: eur.Value, change: eur.Value - eur.Previous },
        { code: "CNY", symbol: "¥", value: cny.Value, change: cny.Value - cny.Previous },
        { code: "GBP", symbol: "£", value: gbp.Value, change: gbp.Value - gbp.Previous },
      ]);
      setLastUpdate(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // Fallback static rates
      setRates([
        { code: "USD", symbol: "$", value: 88.50, change: 0.25 },
        { code: "EUR", symbol: "€", value: 96.20, change: -0.15 },
        { code: "CNY", symbol: "¥", value: 12.18, change: 0.03 },
        { code: "GBP", symbol: "£", value: 112.40, change: 0.55 },
      ]);
      setLastUpdate("—");
    }
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  return (
    <div className={`bg-card border border-border rounded-2xl ${compact ? "p-2.5" : "p-4 md:p-5"}`}>
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-3"}`}>
        <h3 className={`text-foreground font-semibold ${compact ? "text-[11px]" : "text-sm"}`}>{compact ? "Курсы ЦБ" : "Курсы валют ЦБ РФ"}</h3>
        <button onClick={fetchRates} className="text-muted-foreground hover:text-foreground transition-colors" title="Обновить">
          <RefreshCw className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
          {rates.map(r => (
            <div key={r.code} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {!compact && <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">{r.symbol}</span>}
                <span className={`text-foreground font-medium ${compact ? "text-[11px]" : "text-sm"}`}>{compact ? r.code : `${r.code}/RUB`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-foreground font-semibold ${compact ? "text-[11px]" : "text-sm"}`}>{r.value.toFixed(2)}</span>
                <span className={`flex items-center gap-0.5 font-medium ${compact ? "text-[9px]" : "text-[11px]"} ${r.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {r.change >= 0 ? <TrendingUp className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} /> : <TrendingDown className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />}
                  {r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {lastUpdate && !compact && (
        <p className="text-muted-foreground text-[10px] mt-3 text-right">Обновлено в {lastUpdate}</p>
      )}
    </div>
  );
};

export default CurrencyRatesWidget;
