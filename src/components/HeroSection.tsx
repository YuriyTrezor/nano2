import { ArrowRight, Zap, Globe, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const BankCard = ({
  variant,
  number,
  holder,
  expiry,
  type,
  className,
}: {
  variant: "dark" | "blue";
  number: string;
  holder: string;
  expiry: string;
  type: "visa" | "mastercard";
  className?: string;
}) => {
  const bg = variant === "dark"
    ? "bg-gradient-to-br from-[hsl(220,20%,22%)] to-[hsl(220,20%,14%)]"
    : "bg-gradient-to-br from-[hsl(217,90%,55%)] to-[hsl(230,80%,45%)]";

  return (
    <div className={`${bg} rounded-2xl p-5 sm:p-6 w-full max-w-[340px] h-[190px] sm:h-[210px] flex flex-col justify-between relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full border border-white/10 -translate-y-8 translate-x-8" />
      <div className="flex justify-between items-start">
        <div>
          <span className="text-white/80 text-xs font-medium">NeoBank</span>
          <div className="w-8 h-6 bg-yellow-500 rounded mt-2" />
        </div>
        <div className="w-8 h-8 rounded-full border border-white/20" />
      </div>
      <div>
        <p className="text-white font-mono text-lg tracking-wider mb-3">{number}</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-white/50 text-[10px] uppercase">Holder</p>
            <p className="text-white text-xs font-medium">{holder}</p>
          </div>
          <div>
            <p className="text-white/50 text-[10px] uppercase">Expiry</p>
            <p className="text-white text-xs font-medium">{expiry}</p>
          </div>
          <p className="text-white font-bold text-xl tracking-widest">
            {type === "visa" ? "VISA" : ""}
            {type === "mastercard" && (
              <span className="flex">
                <span className="w-6 h-6 rounded-full bg-red-500 -mr-2" />
                <span className="w-6 h-6 rounded-full bg-orange-400" />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex items-center">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-tight text-foreground mb-4 sm:mb-6">
            {t("Зарубежные банковские карты Visa и Mastercard")}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 max-w-lg">
            {t("Откройте карту удалённо")}
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" /> {t("Готовая карта за 1 день")}
            </div>
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-primary" /> {t("Доставка в любую точку мира")}
            </div>
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
              <Circle className="w-4 h-4 text-primary" /> {t("Переводы SWIFT без ограничений")}
            </div>
          </div>
          <a href="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8">
              {t("Войти в личный кабинет")} <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </div>
        <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0">
          <BankCard
            variant="dark"
            number="4111  ••••  ••••  1111"
            holder="ALEX IVANOV"
            expiry="12/28"
            type="visa"
            className="relative z-10"
          />
          <BankCard
            variant="blue"
            number="5142  ••••  ••••  2563"
            holder="ALEX IVANOV"
            expiry="09/28"
            type="mastercard"
            className="absolute top-16 sm:top-20 left-4 sm:left-10 lg:left-0 z-20"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
