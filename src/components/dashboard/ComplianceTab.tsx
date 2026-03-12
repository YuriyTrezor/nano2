import { FileWarning, Shield, CheckCircle2, FileText, Clock, Phone, ArrowRight, BadgeCheck, Crown, Gem, AlertTriangle, Scale, Globe, Lock, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const faqItems = [
  {
    q: "Почему у меня запросили документы?",
    a: "В соответствии с Федеральным законом № 115-ФЗ «О противодействии легализации доходов» и международными стандартами FATF, финансовые организации обязаны проводить проверку источника происхождения средств. Это стандартная процедура, применяемая ко всем клиентам при достижении определённых пороговых значений операций."
  },
  {
    q: "Что будет, если не предоставить документы?",
    a: "До предоставления документов операции по счёту будут ограничены. Ваши средства в полной безопасности и остаются на счёте. После успешной проверки все ограничения снимаются автоматически в течение 1–24 часов."
  },
  {
    q: "Какие документы обычно требуются?",
    a: "Перечень зависит от суммы и характера операций: справка 2-НДФЛ, налоговая декларация, договор купли-продажи, трудовой договор. Наши специалисты помогут определить минимально необходимый пакет."
  },
  {
    q: "Мои данные в безопасности?",
    a: "Абсолютно. Все документы передаются по зашифрованному каналу, хранятся в защищённом хранилище и обрабатываются в строгом соответствии с ФЗ-152 «О персональных данных». Доступ имеют только сертифицированные специалисты комплаенс-отдела."
  },
];

interface ComplianceSettings {
  assisted_price: string;
  full_price: string;
  gold_discount: number;
  platinum_discount: number;
  diamond_discount: number;
}

const ComplianceTab = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [settings, setSettings] = useState<ComplianceSettings>({
    assisted_price: "24 999 ₽",
    full_price: "44 999 ₽",
    gold_discount: 10,
    platinum_discount: 15,
    diamond_discount: 25,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("compliance_settings" as any)
        .select("assisted_price, full_price, gold_discount, platinum_discount, diamond_discount")
        .limit(1)
        .single();
      if (data) {
        setSettings(data as any);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - centered */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FileWarning className="w-6 h-6 text-[hsl(210,80%,60%)]" />
          <h1 className="text-2xl font-bold text-foreground">Подтверждение происхождения средств</h1>
        </div>
        <p className="text-muted-foreground text-sm">Информация о процедуре и варианты решения</p>
      </div>

      {/* Info banner - centered */}
      <div className="bg-[hsl(210,80%,50%)]/10 border border-[hsl(210,80%,50%)]/20 rounded-2xl p-5 mb-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-5 h-5 text-[hsl(210,80%,60%)]" />
          <div>
            <h3 className="text-foreground font-semibold mb-1">Это стандартная процедура</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
              Запрос документов о происхождении средств — обязательная процедура, установленная законодательством РФ 
              (ФЗ-115) и международными стандартами. Это не связано с какими-либо нарушениями с Вашей стороны. 
              Все крупные банки мира следуют аналогичным требованиям. Пожалуйста, не переживайте — мы готовы 
              помочь Вам пройти эту процедуру максимально быстро и комфортно.
            </p>
          </div>
        </div>
      </div>

      {/* What's needed - centered */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-center">
        <h3 className="text-foreground font-semibold mb-4 flex items-center justify-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Какие документы могут потребоваться
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Справка 2-НДФЛ / справка о доходах",
            "Налоговая декларация (3-НДФЛ)",
            "Договор купли-продажи имущества",
            "Трудовой или гражданско-правовой договор",
            "Документы о наследстве / дарении",
            "Справка о получении дивидендов",
            "Иные подтверждающие документы",
          ].map((doc, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground text-sm">{doc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Solutions heading */}
      <h2 className="text-foreground font-bold text-lg mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5 text-primary" />
        Варианты решения
      </h2>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Option 1: Self */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-foreground font-semibold mb-1">Самостоятельно</h3>
          <p className="text-muted-foreground text-xs mb-4 flex-1">
            Вы собираете и предоставляете документы самостоятельно. Мы проверим их и снимем ограничения.
          </p>
          <div className="mb-4">
            <span className="text-2xl font-bold text-foreground">Бесплатно</span>
          </div>
          <ul className="space-y-2 mb-5 text-sm">
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              Самостоятельный сбор документов
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              Срок проверки: до 7 рабочих дней
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
              Базовая консультация
            </li>
          </ul>
          <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/verification")}>
            Загрузить документы
          </Button>
        </div>

        {/* Option 2: Assisted */}
        <div className="bg-card border-2 border-primary rounded-2xl p-5 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
            ПОПУЛЯРНЫЙ
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-foreground font-semibold mb-1">С поддержкой банка</h3>
          <p className="text-muted-foreground text-xs mb-4 flex-1">
            Персональный менеджер поможет собрать документы, подготовит справки и проведёт проверку в приоритетном порядке.
          </p>
          <div className="mb-4">
            <span className="text-2xl font-bold text-foreground">{settings.assisted_price}</span>
            <span className="text-muted-foreground text-xs ml-1">разово</span>
          </div>
          <ul className="space-y-2 mb-5 text-sm">
            <li className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              Персональный менеджер
            </li>
            <li className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              Помощь в сборе и оформлении
            </li>
            <li className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              Приоритетная проверка: 1–3 дня
            </li>
            <li className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              Подготовка сопроводительных справок
            </li>
          </ul>
          <Button className="w-full" onClick={() => navigate("/dashboard/support")}>
            Обратиться к менеджеру
          </Button>
        </div>

        {/* Option 3: Premium */}
        <div className="bg-gradient-to-br from-[hsl(210,80%,15%)] to-[hsl(220,70%,10%)] border border-[hsl(210,60%,30%)] rounded-2xl p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-[hsl(210,80%,50%)]/20 flex items-center justify-center mb-3">
            <Gem className="w-5 h-5 text-[hsl(210,80%,60%)]" />
          </div>
          <h3 className="text-white font-semibold mb-1">Полное сопровождение</h3>
          <p className="text-white/60 text-xs mb-4 flex-1">
            Комплексное решение «под ключ». Мы берём на себя все этапы: от анализа ситуации до полного закрытия запроса. 
            Включает юридическое консультирование.
          </p>
          <div className="mb-4">
            <span className="text-2xl font-bold text-white">{settings.full_price}</span>
            <span className="text-white/40 text-xs ml-1">разово</span>
          </div>
          <ul className="space-y-2 mb-5 text-sm">
            <li className="flex items-start gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
              Всё из тарифа «С поддержкой»
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
              Юридическая экспертиза
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
              Срочная проверка: до 24 часов
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
              Гарантия положительного результата
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <CheckCircle2 className="w-4 h-4 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
              Защита от повторных запросов 12 мес.
            </li>
          </ul>
          <Button className="w-full bg-[hsl(210,80%,50%)] hover:bg-[hsl(210,80%,45%)] text-white" onClick={() => navigate("/dashboard/support")}>
            Заказать сопровождение
          </Button>
        </div>
      </div>

      {/* Upgrade hint - centered */}
      <div className="bg-gradient-to-r from-[hsl(35,80%,30%)]/10 to-[hsl(270,40%,25%)]/10 border border-[hsl(35,80%,40%)]/20 rounded-2xl p-5 mb-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <BadgeCheck className="w-5 h-5 text-[hsl(35,80%,50%)]" />
          <div>
            <h3 className="text-foreground font-semibold mb-1">Владельцам карт Gold, Platinum и Diamond</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
              Для держателей премиальных карт услуга сопровождения по комплаенс-запросам входит в пакет обслуживания 
              на льготных условиях. Карта <strong className="text-[hsl(35,80%,50%)]">Gold</strong> — скидка {settings.gold_discount}%, 
              <strong className="text-[hsl(270,60%,60%)]"> Platinum</strong> — скидка {settings.platinum_discount}%, 
              <strong className="text-[hsl(195,80%,60%)]"> Diamond</strong> — скидка {settings.diamond_discount}%.
              Обновите свою карту, чтобы получить доступ к расширенной поддержке.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/dashboard/cards")}>
              Узнать о картах <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Process timeline */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Как проходит процедура
        </h3>
        <div className="space-y-4">
          {[
            { step: 1, title: "Получение запроса", desc: "Вы получаете уведомление о необходимости подтверждения. Операции временно ограничены." },
            { step: 2, title: "Выбор варианта", desc: "Определите удобный способ: самостоятельно, с помощью менеджера или полное сопровождение." },
            { step: 3, title: "Предоставление документов", desc: "Загрузите документы через личный кабинет или передайте менеджеру." },
            { step: 4, title: "Проверка и снятие ограничений", desc: "Наш комплаенс-отдел проверяет документы. После одобрения все ограничения снимаются автоматически." },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-foreground font-medium text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Частые вопросы
        </h3>
        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="text-foreground text-sm font-medium">{item.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-3.5 pb-3.5">
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground text-sm font-medium">Нужна помощь?</p>
          <p className="text-muted-foreground text-xs">
            Свяжитесь с Вашим персональным менеджером или напишите в{" "}
            <button onClick={() => navigate("/dashboard/support")} className="text-primary hover:underline">
              чат поддержки
            </button>
            . Мы поможем разобраться в ситуации и подберём оптимальное решение.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTab;
