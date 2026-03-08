import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Rate {
  code: string;
  symbol: string;
  value: number;
  change: number;
}

const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", GBP: "£" };

const fetchFromCBR = async (): Promise<Rate[]> => {
  const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
  const data = await res.json();
  return ["USD", "EUR", "CNY", "GBP"].map(code => {
    const v = data.Valute[code];
    return {
      code,
      symbol: SYMBOLS[code],
      value: v.Value / v.Nominal,
      change: (v.Value - v.Previous) / v.Nominal,
    };
  });
};

const fetchFromDB = async (): Promise<Rate[] | null> => {
  const { data } = await supabase
    .from("currency_rates")
    .select("code, symbol, value, change")
    .order("code");
  if (data && data.length > 0) {
    return data.map(r => ({
      code: r.code,
      symbol: r.symbol,
      value: Number(r.value),
      change: Number(r.change),
    }));
  }
  return null;
};

const CurrencyRatesCompact = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchRates = async () => {
    setLoading(true);
    try {
      // Try DB first (cached from cron), fallback to direct API
      const dbRates = await fetchFromDB();
      if (dbRates) {
        setRates(dbRates);
      } else {
        setRates(await fetchFromCBR());
      }
      setLastUpdate(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    } catch {
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
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-foreground font-semibold text-sm">Курсы валют ЦБ РФ</h3>
        <button onClick={fetchRates} className="text-muted-foreground hover:text-foreground transition-colors" title="Обновить">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-12 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {rates.map(r => (
            <div key={r.code} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">{r.symbol}</span>
                <span className="text-foreground font-medium text-sm">{r.code}/RUB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-foreground font-semibold text-sm">{r.value.toFixed(2)}</span>
                <span className={`flex items-center gap-0.5 font-medium text-[11px] ${r.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {r.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {lastUpdate && (
        <p className="text-muted-foreground text-[10px] mt-3 text-right">Обновлено в {lastUpdate}</p>
      )}
    </div>
  );
};

export default CurrencyRatesCompact;
