import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, PiggyBank, Landmark,
  Shield, MessageSquare, Settings, HelpCircle, LogOut, Home
} from "lucide-react";

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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-48 border-r border-border flex flex-col fixed h-full bg-background z-10">
        <div className="p-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-foreground font-bold text-sm">NeoBank</div>
            <div className="text-muted-foreground text-[10px]">Онлайн-банкинг</div>
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
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
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
                {link.label}
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
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
          <a
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-secondary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-48 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
