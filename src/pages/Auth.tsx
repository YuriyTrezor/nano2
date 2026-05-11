import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import neobankLogo from "@/assets/neobank-logo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, displayName, phone, lastName);
      if (error) {
        toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
      } else {
        // Auto-login right after signup
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          toast({ title: "Регистрация успешна", description: "Войдите в аккаунт." });
          setIsLogin(true);
        } else {
          navigate("/dashboard");
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <a href="/" className="flex items-center gap-3 mb-8">
        <img src={neobankLogo} alt="NeoBank" className="h-10 rounded-md opacity-90 brightness-90" />
      </a>

      <div className="w-full max-w-md bg-card rounded-2xl p-8 border border-border">
        <h2 className="text-foreground text-xl font-semibold text-center mb-6">
          {isLogin ? "Вход в аккаунт" : "Регистрация"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <Input
                type="text"
                placeholder="Имя"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
              <Input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                required
              />
              <Input
                type="tel"
                placeholder="Номер телефона"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            required
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            required
            minLength={6}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-4">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
