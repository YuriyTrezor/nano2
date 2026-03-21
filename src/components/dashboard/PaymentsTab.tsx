import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Flame, Wifi, Tv, Zap, FileText, Plus, Clock, Trash2, ToggleLeft, ToggleRight, ChevronRight, ChevronLeft, QrCode, AlertTriangle, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const providersMap: Record<string, Array<{ name: string; desc: string }>> = {
  "Мобильная связь": [
    { name: "МТС", desc: "ПАО «МТС»" },
    { name: "Билайн", desc: "ПАО «ВымпелКом»" },
    { name: "МегаФон", desc: "ПАО «МегаФон»" },
    { name: "Tele2", desc: "ООО «Т2 Мобайл»" },
    { name: "Yota", desc: "ООО «Скартел»" },
    { name: "Ростелеком Мобайл", desc: "ПАО «Ростелеком»" },
  ],
  "ЖКХ": [
    { name: "МосОблЕИРЦ", desc: "Единый расчётный центр" },
    { name: "ГИС ЖКХ", desc: "Государственная система" },
    { name: "Мосэнергосбыт", desc: "АО «Мосэнергосбыт»" },
    { name: "Мосводоканал", desc: "АО «Мосводоканал»" },
    { name: "МОЭК", desc: "ПАО «МОЭК»" },
    { name: "УК «Домком»", desc: "Управляющая компания" },
  ],
  "Интернет": [
    { name: "Ростелеком", desc: "ПАО «Ростелеком»" },
    { name: "Дом.ру", desc: "АО «ЭР-Телеком Холдинг»" },
    { name: "Билайн Домашний", desc: "ПАО «ВымпелКом»" },
    { name: "МТС Домашний", desc: "ПАО «МТС»" },
    { name: "NetByNet", desc: "ООО «Нэт Бай Нэт»" },
    { name: "ТТК", desc: "АО «Компания ТТК»" },
  ],
  "Телевидение": [
    { name: "Триколор", desc: "АО «НСК»" },
    { name: "НТВ-Плюс", desc: "АО «НТВ-Плюс»" },
    { name: "МТС ТВ", desc: "ПАО «МТС»" },
    { name: "Ростелеком ТВ", desc: "ПАО «Ростелеком»" },
    { name: "Wink", desc: "ПАО «Ростелеком»" },
    { name: "Кинопоиск", desc: "ООО «Кинопоиск»" },
  ],
  "Электричество": [
    { name: "Мосэнергосбыт", desc: "АО «Мосэнергосбыт»" },
    { name: "Россети", desc: "ПАО «Россети»" },
    { name: "ТНС энерго", desc: "ГК «ТНС энерго»" },
    { name: "Петроэлектросбыт", desc: "ГУП «ПЭС»" },
    { name: "Энергосбыт Плюс", desc: "ПАО «ЭнергосбыТ Плюс»" },
    { name: "МРСК Центра", desc: "ПАО «МРСК Центра»" },
  ],
  "Налоги и штрафы": [
    { name: "ФНС России", desc: "Федеральная налоговая служба" },
    { name: "Госуслуги", desc: "Портал госуслуг" },
    { name: "ГИБДД", desc: "Штрафы ГИБДД" },
    { name: "ФССП", desc: "Служба судебных приставов" },
    { name: "Росреестр", desc: "Гос. пошлины" },
    { name: "ПФР", desc: "Пенсионный фонд" },
  ],
};

const paymentCategories = [
  { icon: Phone, label: "Мобильная связь", labelEn: "Mobile", color: "hsl(210,70%,50%)" },
  { icon: Flame, label: "ЖКХ", labelEn: "Utilities", color: "hsl(15,80%,50%)" },
  { icon: Wifi, label: "Интернет", labelEn: "Internet", color: "hsl(195,80%,45%)" },
  { icon: Tv, label: "Телевидение", labelEn: "Television", color: "hsl(270,60%,50%)" },
  { icon: Zap, label: "Электричество", labelEn: "Electricity", color: "hsl(45,90%,50%)" },
  { icon: FileText, label: "Налоги и штрафы", labelEn: "Taxes & Fines", color: "hsl(0,60%,50%)" },
];

interface AutoPayment {
  id: string;
  category: string;
  account: string;
  amount: string;
  active: boolean;
  nextDate: string;
}

const mockAutoPayments: AutoPayment[] = [
  { id: "1", category: "Мобильная связь", account: "+7 (999) 123-45-67", amount: "500", active: true, nextDate: "25.03.2026" },
  { id: "2", category: "Интернет", account: "Договор №847291", amount: "890", active: true, nextDate: "01.04.2026" },
  { id: "3", category: "ЖКХ", account: "ЛС 4820193756", amount: "6 240", active: false, nextDate: "05.04.2026" },
];

type Step = "categories" | "providers" | "blocked" | "qr";

const PaymentsTab = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [autoPayments, setAutoPayments] = useState<AutoPayment[]>(mockAutoPayments);
  const [showQr, setShowQr] = useState(false);

  const handleCategoryClick = (label: string) => {
    setSelectedCategory(label);
    setSelectedProvider(null);
    setStep("providers");
  };

  const handleProviderClick = (name: string) => {
    setSelectedProvider(name);
    setStep("blocked");
  };

  const handleBack = () => {
    if (step === "blocked") {
      setStep("providers");
      setSelectedProvider(null);
    } else if (step === "providers") {
      setStep("categories");
      setSelectedCategory(null);
    } else if (step === "qr") {
      setStep("categories");
    }
  };

  const toggleAuto = (id: string) => {
    setAutoPayments(prev =>
      prev.map(ap => ap.id === id ? { ...ap, active: !ap.active } : ap)
    );
    toast.success("Статус автоплатежа обновлён");
  };

  const deleteAuto = (id: string) => {
    setAutoPayments(prev => prev.filter(ap => ap.id !== id));
    toast.success("Автоплатёж удалён");
  };

  const getCategoryIcon = (label: string) => {
    const cat = paymentCategories.find(c => c.label === label);
    return cat ? cat.icon : FileText;
  };

  const getCategoryColor = (label: string) => {
    const cat = paymentCategories.find(c => c.label === label);
    return cat ? cat.color : "hsl(210,10%,50%)";
  };

  const currentProviders = selectedCategory ? providersMap[selectedCategory] || [] : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("Платежи и автоплатежи")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Оплата услуг и управление автоплатежами")}</p>
      </div>

      {/* Step: Categories */}
      {step === "categories" && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">{t("Оплата услуг")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {paymentCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 active:scale-[0.97]"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{t(cat.label)}</span>
              </button>
            ))}
          </div>

          {/* QR Payment button */}
          <div className="mt-4">
            <button
              onClick={() => setStep("qr")}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-foreground">QR-оплата</p>
                <p className="text-xs text-muted-foreground">Оплата по QR-коду через СБП</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Providers */}
      {step === "providers" && selectedCategory && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("Назад")}
          </button>

          <h2 className="text-sm font-semibold text-foreground mb-3">{t(selectedCategory)}</h2>
          <div className="space-y-1.5">
            {currentProviders.map((prov) => {
              const CatIcon = getCategoryIcon(selectedCategory);
              const catColor = getCategoryColor(selectedCategory);
              return (
                <button
                  key={prov.name}
                  onClick={() => handleProviderClick(prov.name)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 active:scale-[0.99]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${catColor}15` }}
                  >
                    <CatIcon className="w-4 h-4" style={{ color: catColor }} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{prov.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{prov.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Blocked message */}
      {step === "blocked" && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("Назад")}
          </button>

          <div className="bg-card border border-orange-500/30 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {selectedProvider}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Операция доступна только через платёжную систему карты «МИР». 
                Свяжитесь с вашим менеджером, чтобы её настроить.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStep("categories");
                setSelectedCategory(null);
                setSelectedProvider(null);
              }}
              className="mt-2"
            >
              Понятно
            </Button>
          </div>
        </div>
      )}

      {/* Step: QR Payment */}
      {step === "qr" && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("Назад")}
          </button>

          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ScanLine className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">QR-оплата через СБП</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Сканируйте QR-код для мгновенной оплаты через Систему быстрых платежей
              </p>
            </div>

            {/* Fake QR area */}
            <div className="mx-auto w-48 h-48 bg-secondary rounded-2xl border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-[2px] p-4 opacity-20">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-foreground rounded-[1px]"
                    style={{ opacity: Math.random() > 0.4 ? 1 : 0 }}
                  />
                ))}
              </div>
              <QrCode className="w-16 h-16 text-muted-foreground/40 relative z-10" />
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <p className="text-xs text-orange-400 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Для использования QR-оплаты необходимо подключение карты «МИР» через СБП. 
                Свяжитесь с вашим менеджером для настройки.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto payments — always visible */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t("Автоплатежи")}</h2>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t("Добавить")}
          </Button>
        </div>

        <div className="space-y-2">
          {autoPayments.map((ap) => {
            const Icon = getCategoryIcon(ap.category);
            const color = getCategoryColor(ap.category);
            return (
              <div
                key={ap.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  ap.active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ap.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{ap.account}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{ap.amount} ₽</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px]">{ap.nextDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleAuto(ap.id)}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                    title={ap.active ? "Отключить" : "Включить"}
                  >
                    {ap.active ? (
                      <ToggleRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAuto(ap.id)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
