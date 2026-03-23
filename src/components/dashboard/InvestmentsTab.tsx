import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, BarChart3, Shield, AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Investment {
  id: string;
  name: string;
  ticker: string;
  type: string;
  price: string;
  change: number;
  currency: string;
}

const stocksData: Investment[] = [
  { id: "1", name: "Сбербанк", ticker: "SBER", type: "Акции", price: "267.50", change: 1.2, currency: "₽" },
  { id: "2", name: "Газпром", ticker: "GAZP", type: "Акции", price: "149.30", change: -0.8, currency: "₽" },
  { id: "3", name: "Яндекс", ticker: "YNDX", type: "Акции", price: "3 842.00", change: 2.5, currency: "₽" },
  { id: "4", name: "Лукойл", ticker: "LKOH", type: "Акции", price: "7 120.00", change: 0.3, currency: "₽" },
  { id: "5", name: "Роснефть", ticker: "ROSN", type: "Акции", price: "542.80", change: -1.1, currency: "₽" },
  { id: "6", name: "Норникель", ticker: "GMKN", type: "Акции", price: "14 650.00", change: 1.8, currency: "₽" },
];

const bondsData: Investment[] = [
  { id: "b1", name: "ОФЗ 26238", ticker: "SU26238", type: "Облигации", price: "620.50", change: 0.1, currency: "₽" },
  { id: "b2", name: "ОФЗ 26243", ticker: "SU26243", type: "Облигации", price: "745.20", change: -0.2, currency: "₽" },
  { id: "b3", name: "ОФЗ 26241", ticker: "SU26241", type: "Облигации", price: "830.00", change: 0.05, currency: "₽" },
];

const etfData: Investment[] = [
  { id: "e1", name: "Тинькофф iMOEX", ticker: "TMOS", type: "Фонды", price: "5.82", change: 0.9, currency: "₽" },
  { id: "e2", name: "Сбер S&P 500", ticker: "SBSP", type: "Фонды", price: "18.45", change: 1.5, currency: "₽" },
  { id: "e3", name: "FinEx Gold", ticker: "FXGD", type: "Фонды", price: "1.12", change: 0.4, currency: "$" },
];

type Tab = "stocks" | "bonds" | "etf";

const InvestmentsTab = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("stocks");
  const [selectedInstrument, setSelectedInstrument] = useState<Investment | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: "stocks", label: "Акции" },
    { key: "bonds", label: "Облигации" },
    { key: "etf", label: "Фонды (ETF)" },
  ];

  const dataMap: Record<Tab, Investment[]> = {
    stocks: stocksData,
    bonds: bondsData,
    etf: etfData,
  };

  const currentData = dataMap[activeTab];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("Инвестиции")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Акции, облигации и инвестиционные фонды")}</p>
      </div>

      {/* Portfolio summary */}
      <div className="bg-gradient-to-r from-primary/80 to-primary rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-primary-foreground/80" />
            <p className="text-sm font-medium text-primary-foreground/80">{t("Портфель")}</p>
          </div>
          <p className="text-3xl font-bold text-primary-foreground">0,00 ₽</p>
          <p className="text-xs text-primary-foreground/60 mt-1">{t("Инвестиции появятся после открытия брокерского счёта")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedInstrument(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Instrument selected → blocked */}
      {selectedInstrument ? (
        <div className="animate-in fade-in-0 duration-200">
          <button
            onClick={() => setSelectedInstrument(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            ← {t("Назад")}
          </button>

          <div className="bg-card border border-orange-500/30 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {selectedInstrument.name} ({selectedInstrument.ticker})
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Для покупки инвестиционных инструментов необходимо открыть брокерский счёт. 
                Свяжитесь с вашим менеджером для оформления.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedInstrument(null)} className="mt-2">
              Понятно
            </Button>
          </div>
        </div>
      ) : (
        /* Instruments list */
        <div className="space-y-1.5">
          {currentData.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedInstrument(item)}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-xs">{item.ticker.slice(0, 4)}</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.ticker} · {item.type}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{item.price} {item.currency}</p>
                <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${item.change >= 0 ? "text-primary" : "text-destructive"}`}>
                  {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.change >= 0 ? "+" : ""}{item.change}%
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{t("Информация")}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Инвестиционные операции осуществляются через лицензированного брокера. 
              Все сделки защищены и находятся под контролем регулятора. 
              Прошлые результаты не гарантируют будущей доходности.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsTab;
