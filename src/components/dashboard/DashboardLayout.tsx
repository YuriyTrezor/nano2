import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, PiggyBank, Landmark,
  Shield, MessageSquare, Settings, HelpCircle, LogOut, Home, Search, Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const mainLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Обзор", end: true },
  { to: "/dashboard/transfers", icon: ArrowLeftRight, label: "Переводы" },
  { to: "/dashboard/cards", icon: CreditCard, label: "Карты" },
  { to: "/dashboard/deposits", icon: PiggyBank, label: "Вклады" },
  { to: "/dashboard/credits", icon: Landmark, label: "Кредиты" },
];

const adminLinks = [
  { to: "/dashboard/admin", icon: Shield, label: "Админ-панель", highlight: true },
  { to: "/dashboard/support", icon: MessageSquare, label: "Обращения", highlight: true },
];

const bottomLinks = [
  { to: "/dashboard/settings", icon: Settings, label: "Настройки" },
  { to: "/dashboard/help", icon: HelpCircle, label: "Поддержка" },
];

// Mobile tab bar items (subset)
const mobileTabLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Обзор", end: true },
  { to: "/dashboard/transfers", icon: ArrowLeftRight, label: "Переводы" },
  { to: "/dashboard/cards", icon: CreditCard, label: "Карты" },
  { to: "/dashboard/admin", icon: Shield, label: "Админ" },
  { to: "/dashboard/settings", icon: Settings, label: "Ещё" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-48 border-r border-border flex-col fixed h-full bg-background z-10">
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-foreground font-bold text-sm">NeoBank</div>
            <div className="text-muted-foreground text-[10px]">{t("Онлайн-банкинг")}</div>
          </div>
        </div>

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

          <div className="pt-2">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
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
              </NavLink>
            ))}
          </div>
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
      <main className="flex-1 md:ml-48 pb-24 md:pb-6">
        {/* Top header bar */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 flex items-center justify-end gap-3">
          <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">5</span>
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            CH
          </div>
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
