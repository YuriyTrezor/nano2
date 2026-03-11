import { FileText, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Scale, Landmark, HelpCircle, CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const Documents = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "Proof of Funds" : "Подтверждение происхождения средств"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            {isEn
              ? "Everything you need to know about source of funds verification — why it's required, what to expect, and how we can help."
              : "Всё, что вам нужно знать о верификации источника происхождения средств — зачем это нужно, чего ожидать и как мы можем помочь."}
          </p>

          {/* Reassurance block */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {isEn ? "Don't worry — this is completely normal" : "Не переживайте — это абсолютно нормально"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isEn
                    ? "If your bank has requested documents confirming the source of your funds, there is no reason for concern. This is a standard procedure required by international financial regulations (AML/KYC) and is practiced by every licensed financial institution worldwide. This request does not mean suspicion — it means your bank operates legally and transparently."
                    : "Если ваш банк запросил документы, подтверждающие происхождение денежных средств, — не стоит беспокоиться. Это стандартная процедура, предусмотренная международным финансовым законодательством (AML/KYC), и применяется абсолютно каждым лицензированным финансовым учреждением в мире. Этот запрос не означает подозрений — он означает, что ваш банк работает легально и прозрачно."}
                </p>
              </div>
            </div>
          </div>

          {/* Why is this required */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Why is this required?" : "Почему это требуется?"}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {isEn
                  ? "Under the European Anti-Money Laundering Directives (AMLD), the USA PATRIOT Act, and similar legislation in most jurisdictions, financial institutions are legally obligated to verify the origin of funds exceeding certain thresholds."
                  : "В соответствии с Европейскими директивами по противодействию отмыванию денежных средств (AMLD), Актом «USA PATRIOT» и аналогичным законодательством большинства юрисдикций, финансовые учреждения обязаны по закону верифицировать происхождение средств, превышающих установленные пороговые значения."}
              </p>
              <p>
                {isEn
                  ? "This requirement applies to all clients equally — from individual entrepreneurs to corporate accounts. It is not a personal check on you, but a mandatory compliance procedure that protects both the institution and its clients."
                  : "Это требование распространяется на всех клиентов в равной степени — от индивидуальных предпринимателей до корпоративных счетов. Это не персональная проверка, а обязательная процедура комплаенса, которая защищает как учреждение, так и его клиентов."}
              </p>
            </div>
          </div>

          {/* What documents are typically required */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "What documents may be required?" : "Какие документы могут потребоваться?"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(isEn ? [
                "Employment contract or payslips",
                "Tax returns or declarations",
                "Sale of property or assets",
                "Business income statements",
                "Inheritance or gift documentation",
                "Investment portfolio statements",
                "Loan or credit agreements",
                "Bank statements from other institutions",
              ] : [
                "Трудовой договор или расчётные листы",
                "Налоговые декларации",
                "Договор продажи имущества или активов",
                "Документы о доходах от бизнеса",
                "Документы о наследстве или дарении",
                "Выписки инвестиционного портфеля",
                "Кредитные договоры",
                "Выписки из других банков",
              ]).map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What happens if you don't provide */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "What if I don't provide the documents?" : "Что будет, если не предоставить документы?"}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {isEn
                  ? "If the requested documents are not provided within the specified timeframe, the financial institution may be forced to restrict account operations — including withdrawals, transfers, and card payments. In some cases, the account may be frozen entirely until the verification is complete."
                  : "Если запрашиваемые документы не будут предоставлены в установленный срок, финансовое учреждение может быть вынуждено ограничить операции по счёту — включая вывод средств, переводы и платежи картой. В отдельных случаях счёт может быть заморожен полностью до завершения проверки."}
              </p>
              <p className="font-medium text-foreground">
                {isEn
                  ? "This is why timely action is critical — the sooner you submit the required documents, the sooner your account returns to full operational status."
                  : "Именно поэтому так важно действовать оперативно — чем раньше вы предоставите необходимые документы, тем быстрее ваш счёт вернётся к полноценному функционированию."}
              </p>
            </div>
          </div>

          {/* How NeoBank can help */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <Landmark className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "How NeoBank can help" : "Как NeoBank может помочь"}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {isEn
                  ? "We understand that gathering and preparing the right documents can be stressful and confusing. That's why NeoBank offers professional assistance in preparing your proof of funds documentation."
                  : "Мы понимаем, что сбор и подготовка необходимых документов может вызывать стресс и замешательство. Именно поэтому NeoBank предлагает профессиональную помощь в подготовке документации для подтверждения происхождения средств."}
              </p>
              <p className="font-medium text-foreground">
                {isEn
                  ? "Our compliance specialists will:"
                  : "Наши специалисты по комплаенсу:"}
              </p>
              <div className="space-y-2">
                {(isEn ? [
                  "Analyze your situation and determine exactly which documents are needed",
                  "Prepare a complete documentation package that meets regulatory standards",
                  "Provide a professional cover letter and certification of documents",
                  "Liaise with your bank's compliance department on your behalf",
                  "Ensure your case is processed as quickly as possible",
                ] : [
                  "Проанализируют вашу ситуацию и определят, какие именно документы необходимы",
                  "Подготовят полный пакет документации, соответствующий нормативным стандартам",
                  "Предоставят профессиональное сопроводительное письмо и заверение документов",
                  "Проведут переговоры с комплаенс-отделом вашего банка от вашего имени",
                  "Обеспечат максимально быстрое рассмотрение вашего дела",
                ]).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service tiers */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Our Solutions" : "Наши решения"}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {isEn
                ? "Choose the level of support that suits your needs. Higher-tier card holders receive enhanced compliance support as part of their package."
                : "Выберите уровень поддержки, который подходит именно вам. Держатели карт более высокого уровня получают расширенную поддержку по комплаенсу в составе пакета услуг."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Standard */}
              <div className="border border-border rounded-xl p-5 bg-secondary/30 flex flex-col">
                <h3 className="font-bold text-foreground mb-1">Standard</h3>
                <p className="text-muted-foreground text-xs mb-4 flex-1">
                  {isEn
                    ? "Basic consultation and document checklist. Suitable for straightforward cases."
                    : "Базовая консультация и чек-лист документов. Подходит для стандартных ситуаций."}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Document checklist" : "Чек-лист документов"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Email consultation" : "Консультация по email"}</div>
                </div>
                <a href="/auth">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    {isEn ? "Get Started" : "Начать"} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
              {/* Gold / Platinum */}
              <div className="border border-primary/40 rounded-xl p-5 bg-primary/5 flex flex-col relative">
                <span className="absolute -top-2.5 right-4 text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                  {isEn ? "Popular" : "Популярно"}
                </span>
                <h3 className="font-bold text-foreground mb-1">Gold / Platinum</h3>
                <p className="text-muted-foreground text-xs mb-4 flex-1">
                  {isEn
                    ? "Full document preparation and professional cover letter. Priority processing."
                    : "Полная подготовка документов и профессиональное сопроводительное письмо. Приоритетная обработка."}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Full document package" : "Полный пакет документов"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Cover letter" : "Сопроводительное письмо"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Priority support" : "Приоритетная поддержка"}</div>
                </div>
                <a href="/auth">
                  <Button size="sm" className="w-full gap-1">
                    {isEn ? "Get Started" : "Начать"} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
              {/* Diamond */}
              <div className="border border-border rounded-xl p-5 bg-secondary/30 flex flex-col">
                <h3 className="font-bold text-foreground mb-1">Diamond</h3>
                <p className="text-muted-foreground text-xs mb-4 flex-1">
                  {isEn
                    ? "Personal compliance manager. Full bank liaison. Guaranteed resolution."
                    : "Персональный менеджер по комплаенсу. Полное сопровождение. Гарантированное решение."}
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Personal manager" : "Персональный менеджер"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Bank negotiations" : "Переговоры с банком"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Certified documents" : "Заверенные документы"}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" />{isEn ? "Guaranteed result" : "Гарантия результата"}</div>
                </div>
                <a href="/auth">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    {isEn ? "Get Started" : "Начать"} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Frequently Asked Questions" : "Часто задаваемые вопросы"}
              </h2>
            </div>
            <div className="space-y-5">
              {(isEn ? [
                { q: "Is this request legal?", a: "Yes. Financial institutions are legally required to verify the source of funds under AML (Anti-Money Laundering) regulations. This applies to banks in every country." },
                { q: "Will my data be safe?", a: "Absolutely. All documents are processed in accordance with GDPR and stored using bank-grade encryption. Only authorized compliance officers have access." },
                { q: "How long does the process take?", a: "Standard cases are typically resolved within 3–7 business days. With our Gold/Platinum or Diamond packages, processing is significantly faster." },
                { q: "Can my account be closed if I don't comply?", a: "In extreme cases, yes. Banks have the right to terminate the relationship if compliance requirements are not met. This is why we recommend acting promptly." },
              ] : [
                { q: "Это законно?", a: "Да. Финансовые учреждения обязаны по закону верифицировать источник происхождения средств в рамках AML-регулирования (противодействие отмыванию денег). Это применяется к банкам во всех странах мира." },
                { q: "Мои данные в безопасности?", a: "Безусловно. Все документы обрабатываются в соответствии с GDPR и хранятся с использованием банковского шифрования. Доступ имеют только уполномоченные специалисты по комплаенсу." },
                { q: "Сколько времени занимает процесс?", a: "Стандартные случаи, как правило, решаются в течение 3–7 рабочих дней. С пакетами Gold/Platinum или Diamond обработка значительно быстрее." },
                { q: "Могут ли закрыть счёт, если я не предоставлю документы?", a: "В крайних случаях — да. Банки имеют право расторгнуть отношения, если требования комплаенса не выполнены. Именно поэтому мы рекомендуем действовать оперативно." },
              ]).map((item, i) => (
                <div key={i}>
                  <h3 className="text-foreground font-semibold text-sm mb-1">{item.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <FloatingChat />
    </div>
  );
};

export default Documents;
