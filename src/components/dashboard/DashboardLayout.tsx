import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, PiggyBank, Landmark,
  Shield, MessageSquare, Settings, HelpCircle, LogOut, Home, Search, Bell, X, User, Phone, Mail, Wallet, Activity, ShieldCheck,
  TrendingUp, TrendingDown, RefreshCw
} from "lucide-react";
import neobankLogo from "@/assets/neobank-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

const mainLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Обзор", end: true },
  { to: "/dashboard/transfers", icon: ArrowLeftRight, label: "Переводы" },
  { to: "/dashboard/cards", icon: CreditCard, label: "Карты" },
  { to: "/dashboard/deposits", icon: PiggyBank, label: "Вклады" },
  { to: "/dashboard/credits", icon: Landmark, label: "Кредиты" },
  { to: "/dashboard/rates", icon: TrendingUp, label: "Курс валют" },
];

const adminLinks = [
  { to: "/dashboard/admin", icon: Shield, label: "Админ-панель", highlight: true },
  { to: "/dashboard/support", icon: MessageSquare, label: "Обращения", highlight: true },
  { to: "/dashboard/verifications", icon: ShieldCheck, label: "Верификации", highlight: true },
];

const bottomLinks = [
  { to: "/dashboard/settings", icon: Settings, label: "Настройки" },
  { to: "/support", icon: HelpCircle, label: "Поддержка" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

interface CurrencyRate {
  code: string;
  symbol: string;
  value: number;
  change: number;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [supportUnread, setSupportUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(true);

  // Fetch currency rates
  useEffect(() => {
    const fetchRates = async () => {
      setCurrencyLoading(true);
      try {
        const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
        const data = await res.json();
        const usd = data.Valute.USD;
        const eur = data.Valute.EUR;
        const cny = data.Valute.CNY;
        const gbp = data.Valute.GBP;
        setCurrencyRates([
          { code: "USD", symbol: "$", value: usd.Value, change: usd.Value - usd.Previous },
          { code: "EUR", symbol: "€", value: eur.Value, change: eur.Value - eur.Previous },
          { code: "CNY", symbol: "¥", value: cny.Value, change: cny.Value - cny.Previous },
          { code: "GBP", symbol: "£", value: gbp.Value, change: gbp.Value - gbp.Previous },
        ]);
      } catch {
        setCurrencyRates([
          { code: "USD", symbol: "$", value: 88.50, change: 0.25 },
          { code: "EUR", symbol: "€", value: 96.20, change: -0.15 },
          { code: "CNY", symbol: "¥", value: 12.18, change: 0.03 },
          { code: "GBP", symbol: "£", value: 112.40, change: 0.55 },
        ]);
      }
      setCurrencyLoading(false);
    };
    fetchRates();
  }, []);
  // Fetch real notifications from transactions
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, title, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data.map(tx => ({
          id: tx.id,
          text: `${Number(tx.amount) >= 0 ? "+" : ""}${Number(tx.amount).toLocaleString("ru-RU")} ₽ — ${tx.title}`,
          time: new Date(tx.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          read: true,
        })));
      }
    };
    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, (payload) => {
        const tx = payload.new as any;
        setNotifications(prev => [{
          id: tx.id,
          text: `${Number(tx.amount) >= 0 ? "+" : ""}${Number(tx.amount).toLocaleString("ru-RU")} ₽ — ${tx.title}`,
          time: new Date(tx.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
          read: false,
        }, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Fetch blocked status
  useEffect(() => {
    if (!user) return;
    const fetchBlocked = async () => {
      const { data } = await supabase.from("profiles").select("is_blocked").eq("user_id", user.id).maybeSingle();
      if (data) setIsBlocked(data.is_blocked ?? false);
    };
    fetchBlocked();

    const ch = supabase
      .channel("layout-block")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload) => {
        setIsBlocked((payload.new as any).is_blocked ?? false);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Fetch unread support messages count for admin
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchUnread = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id")
        .eq("sender_role", "user")
        .eq("is_read", false);
      setSupportUnread(data?.length || 0);
    };
    
    fetchUnread();
    
    const channel = supabase
      .channel("sidebar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => {
        fetchUnread();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "U";
  const initials = displayName.substring(0, 2).toUpperCase();

  // Mobile tabs — conditionally include admin
  const mobileTabLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Обзор", end: true },
    { to: "/dashboard/transfers", icon: ArrowLeftRight, label: "Переводы" },
    { to: "/dashboard/cards", icon: CreditCard, label: "Карты" },
    ...(isAdmin ? [{ to: "/dashboard/admin", icon: Shield, label: "Админ" }] : []),
    { to: "/dashboard/settings", icon: Settings, label: "Ещё" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-48 border-r border-border flex-col fixed h-full bg-background z-10">
        <NavLink to="/" className="p-4 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src={neobankLogo} alt="NeoBank" className="h-8 rounded-md opacity-90 brightness-90" />
        </NavLink>

        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {t(link.label)}
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-2">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative",
                      isActive
                        ? "text-primary bg-primary/10"
                        : link.highlight
                        ? "text-orange-400 hover:text-orange-300 hover:bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {t(link.label)}
                  {link.to === "/dashboard/support" && supportUnread > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {supportUnread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="px-2 pb-4 space-y-0.5">
          {bottomLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {t(link.label)}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:text-destructive/80 hover:bg-secondary transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {t("Выйти")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-48 pb-24 md:pb-6 overflow-x-hidden">
        {/* Top header bar */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center justify-end gap-3">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по операциям..."
                className="bg-secondary border-border text-foreground h-9 text-sm"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b border-border">
                <p className="text-foreground font-semibold text-sm">Уведомления</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-3 py-4 text-center text-muted-foreground text-sm">Нет уведомлений</div>
                )}
                {notifications.map(n => (
                  <div key={n.id} className={`px-3 py-2.5 border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm">{n.text}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* User avatar menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {initials}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              {/* Profile header */}
              <div className="bg-primary/10 p-4 rounded-t-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground font-bold truncate">{displayName}</p>
                    <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
                <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                  <Wallet className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">ID</p>
                    <p className="text-foreground text-xs font-mono">{user?.id?.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                  <Activity className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Статус</p>
                    <p className={`text-xs font-medium ${isBlocked ? "text-destructive" : "text-foreground"}`}>
                      {isBlocked ? "Заблокирован" : "Активен"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Contact info */}
              <div className="p-3 space-y-2 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{user?.user_metadata?.phone || "Не указан"}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="p-2">
                <button onClick={() => navigate("/dashboard/settings")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Settings className="w-4 h-4" />
                  Настройки
                </button>
                <button onClick={() => navigate("/dashboard/verification")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                  Верификация
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-14">
          {mobileTabLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <link.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(link.label)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
