import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          N
        </div>
        <span className="text-foreground font-semibold text-2xl">NeoBank</span>
      </div>

      <div className="w-full max-w-md bg-card rounded-2xl p-8 border border-border">
        <h2 className="text-foreground text-xl font-semibold text-center mb-6">
          Вход в аккаунт
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            Войти
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-4">
          Нет аккаунта?{" "}
          <a href="#" className="text-primary hover:underline">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
