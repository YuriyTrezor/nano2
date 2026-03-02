import { Building2, Shield, Globe, Users, TrendingUp, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const timeline = isEn ? [
    { year: "2022", title: "Foundation", desc: "NeoBank was founded with a mission to provide accessible international banking services to clients worldwide, free from geographic restrictions." },
    { year: "2023", title: "International Expansion", desc: "Launch of Visa and Mastercard issuance. Connection to the SWIFT network. Over 5,000 clients served across 30+ countries." },
    { year: "2024", title: "Digital Innovation", desc: "Introduction of USDT payments, multi-currency accounts, and an advanced online banking platform with 24/7 support." },
    { year: "2025", title: "Premium Services", desc: "Launch of the Diamond tier with personal concierge service, auto-bridge technology for safe withdrawals, and enhanced cashback programs." },
    { year: "2026", title: "Today", desc: "NeoBank serves clients in 50+ countries, offering a full range of international banking products with competitive rates and no hidden fees." },
  ] : [
    { year: "2022", title: "Основание", desc: "NeoBank был основан с миссией предоставления доступных международных банковских услуг клиентам по всему миру, свободных от географических ограничений." },
    { year: "2023", title: "Международная экспансия", desc: "Запуск выпуска карт Visa и Mastercard. Подключение к сети SWIFT. Более 5 000 обслуженных клиентов в 30+ странах." },
    { year: "2024", title: "Цифровые инновации", desc: "Внедрение оплаты в USDT, мультивалютных счетов и современной платформы онлайн-банкинга с поддержкой 24/7." },
    { year: "2025", title: "Премиум-сервис", desc: "Запуск уровня Diamond с персональным консьержем, технологией автоопределения мостов для безопасного вывода и расширенными программами кэшбэка." },
    { year: "2026", title: "Сегодня", desc: "NeoBank обслуживает клиентов в 50+ странах, предлагая полный спектр международных банковских продуктов с конкурентными ставками и без скрытых комиссий." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "About NeoBank" : "О банке"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-10">
            {isEn ? "Our mission, history and values" : "Наша миссия, история и ценности"}
          </p>

          {/* Mission */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isEn ? "Our Mission" : "Наша миссия"}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {isEn
                ? "NeoBank was created to give people access to modern international financial services — regardless of their location, citizenship, or geopolitical situation. We believe that banking should be simple, transparent, and accessible to everyone."
                : "NeoBank создан, чтобы дать людям доступ к современным международным финансовым сервисам — вне зависимости от их местоположения, гражданства и геополитической ситуации. Мы верим, что банкинг должен быть простым, прозрачным и доступным для каждого."}
            </p>
          </div>

          {/* Key values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Security" : "Безопасность"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Multi-level encryption, fraud protection, and secure data storage"
                  : "Многоуровневое шифрование, защита от мошенничества и безопасное хранение данных"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Global Access" : "Глобальный доступ"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Clients in 50+ countries, SWIFT transfers worldwide, multi-currency accounts"
                  : "Клиенты в 50+ странах, SWIFT-переводы по всему миру, мультивалютные счета"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Client Focus" : "Клиентоориентированность"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Personal managers, 24/7 support, and individual approach to every client"
                  : "Персональные менеджеры, поддержка 24/7 и индивидуальный подход к каждому клиенту"}
              </p>
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Our History" : "История банка"}
              </h2>
            </div>
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {item.year}
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <h3 className="text-foreground font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numbers */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "NeoBank in Numbers" : "NeoBank в цифрах"}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "50+", label: isEn ? "Countries" : "Стран" },
                { value: "25 000+", label: isEn ? "Clients" : "Клиентов" },
                { value: "24/7", label: isEn ? "Support" : "Поддержка" },
                { value: "4", label: isEn ? "Card tiers" : "Уровня карт" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-4 bg-secondary rounded-xl">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
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

export default About;
