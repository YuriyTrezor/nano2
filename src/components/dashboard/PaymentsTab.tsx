import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Flame, Wifi, Tv, Zap, FileText, Plus, Clock, Trash2, ToggleLeft, ToggleRight, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface Template {
  id: string;
  category: string;
  provider: string;
  account: string;
}

const defaultTemplates: Template[] = [
  { id: "tpl-1", category: "Мобильная связь", provider: "МТС", account: "+7 (900) ***-**-00" },
  { id: "tpl-2", category: "ЖКХ", provider: "МосОблЕИРЦ", account: "Лицевой счёт •••4521" },
  { id: "tpl-3", category: "Интернет", provider: "Ростелеком", account: "Договор •••7890" },
];

const mockAutoPayments: AutoPayment[] = [];

type Step = "categories" | "providers" | "blocked" | "addAuto" | "addAutoProvider";

const PaymentsTab = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [autoPayments, setAutoPayments] = useState<AutoPayment[]>(mockAutoPayments);

  // Add auto-payment form state
  const [addAutoCategory, setAddAutoCategory] = useState<string | null>(null);
  const [addAutoProvider, setAddAutoProvider] = useState<string | null>(null);
  const [addAutoAccount, setAddAutoAccount] = useState("");
  const [addAutoAmount, setAddAutoAmount] = useState("");

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
    } else if (step === "addAutoProvider") {
      setStep("addAuto");
      setAddAutoProvider(null);
    } else if (step === "addAuto") {
      setStep("categories");
      setAddAutoCategory(null);
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

  const handleAddAutoSelectCategory = (label: string) => {
    setAddAutoCategory(label);
    setAddAutoProvider(null);
    setStep("addAutoProvider");
  };

  const handleAddAutoSelectProvider = (name: string) => {
    setAddAutoProvider(name);
  };

  const handleAddAutoSubmit = () => {
    if (!addAutoCategory || !addAutoProvider || !addAutoAccount || !addAutoAmount) {
      toast.error("Заполните все поля");
      return;
    }
    const newAp: AutoPayment = {
      id: Date.now().toString(),
      category: addAutoCategory,
      account: addAutoAccount,
      amount: addAutoAmount,
      active: true,
      nextDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("ru-RU"),
    };
    setAutoPayments(prev => [...prev, newAp]);
    toast.success(`Автоплатёж «${addAutoProvider}» добавлен`);
    // Reset
    setAddAutoCategory(null);
    setAddAutoProvider(null);
    setAddAutoAccount("");
    setAddAutoAmount("");
    setStep("categories");
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
  const addAutoProviders = addAutoCategory ? providersMap[addAutoCategory] || [] : [];

  return (
    <div className="space-y-6 w-full">
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

      {/* Step: Add auto-payment - select category */}
      {step === "addAuto" && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("Назад")}
          </button>

          <h2 className="text-sm font-semibold text-foreground mb-3">{t("Выберите категорию")}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {paymentCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleAddAutoSelectCategory(cat.label)}
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
        </div>
      )}

      {/* Step: Add auto-payment - select provider & fill form */}
      {step === "addAutoProvider" && addAutoCategory && (
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("Назад")}
          </button>

          <h2 className="text-sm font-semibold text-foreground mb-3">{t(addAutoCategory)}</h2>

          {!addAutoProvider ? (
            <div className="space-y-1.5">
              {addAutoProviders.map((prov) => {
                const CatIcon = getCategoryIcon(addAutoCategory);
                const catColor = getCategoryColor(addAutoCategory);
                return (
                  <button
                    key={prov.name}
                    onClick={() => handleAddAutoSelectProvider(prov.name)}
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
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-in fade-in-0 duration-200">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const CatIcon = getCategoryIcon(addAutoCategory);
                  const catColor = getCategoryColor(addAutoCategory);
                  return (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${catColor}15` }}>
                      <CatIcon className="w-4 h-4" style={{ color: catColor }} />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-foreground">{addAutoProvider}</p>
                  <p className="text-xs text-muted-foreground">{addAutoCategory}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Номер счёта / телефон</label>
                <Input
                  value={addAutoAccount}
                  onChange={e => setAddAutoAccount(e.target.value)}
                  placeholder="Введите номер"
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Сумма, ₽</label>
                <Input
                  value={addAutoAmount}
                  onChange={e => setAddAutoAmount(e.target.value)}
                  placeholder="0"
                  type="number"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setAddAutoProvider(null)} className="flex-1">
                  Назад
                </Button>
                <Button onClick={handleAddAutoSubmit} className="flex-1">
                  Добавить
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Шаблоны автоплатежей — always visible at bottom */}
      {step === "categories" && (
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">{t("Шаблоны автоплатежей")}</h2>
          </div>

          <p className="text-xs text-muted-foreground mb-3">{t("Готовые шаблоны для быстрой настройки автоплатежа. Нажмите, чтобы открыть форму с предзаполненными данными.")}</p>

          <div className="space-y-2">
            {/* Default templates — clickable, prefill the add-auto form */}
            {defaultTemplates.map((tpl) => {
              const Icon = getCategoryIcon(tpl.category);
              const color = getCategoryColor(tpl.category);
              return (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setAddAutoCategory(tpl.category);
                    setAddAutoProvider(tpl.provider);
                    setAddAutoAccount(tpl.account);
                    setAddAutoAmount("");
                    setStep("addAutoProvider");
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 active:scale-[0.99] text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tpl.provider}</p>
                    <p className="text-xs text-muted-foreground truncate">{tpl.category} · {tpl.account}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-primary bg-primary/10 shrink-0">
                    {t("Шаблон")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}

            {/* User-created auto-payments */}
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
      )}
    </div>
  );
};

export default PaymentsTab;
