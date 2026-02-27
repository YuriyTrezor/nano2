import { Settings, User, Lock, Palette, Globe, Moon, Sun, Droplets, Monitor } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SettingsTab = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [newPassword, setNewPassword] = useState("");

  const handleSaveProfile = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, last_name: lastName, phone: phone || null },
    });
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("Информация"), description: "Профиль сохранён" });
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newPassword.trim()) {
      toast({ title: "Ошибка", description: "Введите новый пароль", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("Информация"), description: "Пароль успешно изменён" });
        setNewPassword("");
      }
    } catch (err) {
      toast({ title: "Ошибка", description: "Не удалось изменить пароль", variant: "destructive" });
    }
  };

  const themes = [
    { key: "dark" as const, label: "Тёмная", icon: Moon },
    { key: "light" as const, label: "Светлая", icon: Sun },
    { key: "blue" as const, label: "Голубая", icon: Droplets },
    { key: "system" as const, label: "Системная", icon: Monitor },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("Настройки")}</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Управление личным кабинетом</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-foreground font-semibold">Профиль</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Email</label>
              <Input value={user?.email ?? ""} disabled className="bg-secondary border-border text-muted-foreground" />
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Имя</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Фамилия</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Телефон</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border text-foreground" placeholder="+7 (900) 000-00-00" />
            </div>
            <Button onClick={handleSaveProfile} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {t("Сохранить")}
            </Button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-foreground font-semibold">Безопасность</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Новый пароль</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-secondary border-border text-foreground" placeholder="••••••" />
            </div>
            <Button type="button" onClick={handleChangePassword} variant="outline" className="w-full cursor-pointer">
              Изменить пароль
            </Button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-foreground font-semibold">Тема оформления</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {themes.map(th => {
              const Icon = th.icon;
              return (
                <button
                  type="button"
                  key={th.key}
                  onClick={() => setTheme(th.key)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    theme === th.key
                      ? "bg-primary/10 border border-primary text-foreground"
                      : "bg-secondary border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {th.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-foreground font-semibold">Язык</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => lang !== "ru" && toggleLang()}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                lang === "ru"
                  ? "bg-primary/10 border border-primary text-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs font-bold">RU</span> Русский
            </button>
            <button
              onClick={() => lang !== "en" && toggleLang()}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                lang === "en"
                  ? "bg-primary/10 border border-primary text-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs font-bold">EN</span> English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
