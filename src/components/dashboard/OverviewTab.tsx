import { Eye, ArrowUpRight, ArrowDownLeft, Send, Smartphone, CreditCard, Wifi } from "lucide-react";

const transactions = [
  { type: "out", title: "Перевод → 121212121", category: "Перевод", amount: "+103 434 ₽", date: "Вчера, 16:42", positive: true },
  { type: "in", title: "Возврат средств. Причина: неверно указан номер карты (номер введён с пробелами).", category: "Income", amount: "+5 000 ₽", date: "Вчера, 16:25", positive: true },
  { type: "out", title: "Перевод → 434343", category: "Перевод", amount: "-25 000 ₽", date: "Вчера, 16:18", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", amount: "-10 000 ₽", date: "Вчера, 15:39", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", amount: "-3 434 ₽", date: "14 февр., 23:59", positive: false },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", amount: "+676 ₽", date: "14 февр., 23:21", positive: true },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", amount: "+454 ₽", date: "14 февр., 23:03", positive: true },
  { type: "out", title: "Оплатить: Мобильная связь (у56767667)", category: "Мобильная связь", amount: "-98 781 ₽", date: "14 февр., 22:43", positive: false },
  { type: "in", title: "Пополнение счёта", category: "Пополнить", amount: "+152 001 ₽", date: "14 февр., 22:42", positive: true },
];

const OverviewTab = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Добро пожаловать, Chargeback 👋</h1>
        <p className="text-muted-foreground text-sm">Вот обзор ваших финансов</p>
      </div>

      <div className="flex gap-6">
        {/* Left column */}
        <div className="flex-1 space-y-6">
          {/* Balance card */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/80 to-primary p-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium">Общий баланс</p>
                <p className="text-4xl font-bold text-primary-foreground mt-1">₽ 124 350,00</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-primary-foreground/20 text-primary-foreground text-xs px-2 py-0.5 rounded-full">↗ +12.5%</span>
                  <span className="text-primary-foreground/70 text-xs">за последний месяц</span>
                </div>
              </div>
              <Eye className="w-5 h-5 text-primary-foreground/60" />
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Последние операции</h3>
            <div className="space-y-0">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {tx.positive ? (
                        <ArrowDownLeft className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">{tx.title}</p>
                      <p className="text-muted-foreground text-xs">{tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.positive ? 'text-primary' : 'text-foreground'}`}>{tx.amount}</p>
                    <p className="text-muted-foreground text-xs">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-80 space-y-6">
          {/* Card preview */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-muted-foreground text-xs font-medium mb-3 tracking-wider">ДЕБЕТОВАЯ КАРТА</p>
            <div className="bg-gradient-to-br from-secondary to-muted rounded-xl p-4 relative">
              <div className="flex justify-end mb-6">
                <Wifi className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>
              <p className="text-foreground font-mono text-lg tracking-widest mb-4">4 •••• •••• •••• 3891</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-muted-foreground text-[10px]">ВЛАДЕЛЕЦ</p>
                  <p className="text-foreground text-xs font-medium">Chargeback</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">СРОК</p>
                  <p className="text-foreground text-xs font-medium">02/30</p>
                </div>
                <p className="text-foreground font-bold text-lg italic">VISA</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Быстрые действия</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">Перевод</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">Пополнить</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">Оплатить</span>
              </button>
            </div>
          </div>

          {/* Accounts */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">Мои счета</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">RUB</div>
                <div>
                  <p className="text-foreground text-sm font-medium">Основной счёт</p>
                  <p className="text-muted-foreground text-xs">RUB</p>
                </div>
              </div>
              <p className="text-foreground text-sm font-medium">₽ 124 350,00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
