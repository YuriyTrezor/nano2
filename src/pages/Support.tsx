import { HelpCircle, MessageCircle, Phone, Mail, Send as SendIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const faqItems = [
  {
    question: "Как заказать карту?",
    answer: "Перейдите в раздел «Карты», выберите подходящий тариф и нажмите «Заказать». Виртуальная карта будет готова мгновенно.",
  },
  {
    question: "Как сделать перевод?",
    answer: "Откройте раздел «Переводы» в личном кабинете, введите реквизиты получателя и сумму. Переводы между клиентами NeoBank — мгновенные и бесплатные.",
  },
  {
    question: "Как открыть вклад?",
    answer: "В разделе «Вклады» выберите подходящую программу, укажите сумму и срок. Проценты начисляются ежемесячно.",
  },
  {
    question: "Как изменить пароль?",
    answer: "Перейдите в «Настройки» → «Безопасность» → «Изменить пароль». Введите текущий и новый пароль для подтверждения.",
  },
  {
    question: "Что делать, если карта заблокирована?",
    answer: "Вы можете разблокировать карту в разделе «Карты» → «Управление» или обратиться в поддержку через чат.",
  },
];

const Support = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Войдите в аккаунт, чтобы отправить обращение", variant: "destructive" });
      return;
    }

    setSending(true);
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: subject.trim() })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      toast({ title: "Ошибка при создании обращения", variant: "destructive" });
      setSending(false);
      return;
    }

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      sender_role: "user",
      text: message.trim(),
    });

    toast({ title: "Обращение отправлено!", description: "Мы ответим вам в ближайшее время." });
    setSubject("");
    setMessage("");
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Поддержка</h1>
          </div>
          <p className="text-muted-foreground mb-10">Мы всегда готовы помочь</p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* FAQ - left side */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Частые вопросы</h2>
              <Accordion type="single" collapsible className="space-y-1">
                {faqItems.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Right side */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Contact form */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Написать обращение</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Тема</label>
                    <Input
                      placeholder="Кратко опишите вопрос"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1.5 block">Сообщение</label>
                    <Textarea
                      placeholder="Подробно опишите вашу проблему..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="bg-secondary border-border text-foreground min-h-[120px] resize-y"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <SendIcon className="w-4 h-4" />
                    {sending ? "Отправка..." : "Отправить"}
                  </Button>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Контакты</h2>
                <div className="space-y-3">
                  <a href="tel:88004582537" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    8 (800) 458-25-37 (бесплатно)
                  </a>
                  <a href="mailto:support@neobank.ru" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    support@neobank.ru
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Чат в приложении
                  </div>
                  <a href="https://t.me/Neobank_manager" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm">
                    <SendIcon className="w-4 h-4 text-primary" />
                    Telegram: @Neobank_manager
                  </a>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-xs font-medium mb-1">Время работы:</p>
                  <p className="text-foreground text-sm">Пн — Пт: 10:00 — 22:00 (МСК)</p>
                  <p className="text-muted-foreground text-sm">Сб, Вс — выходной</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FloatingChat />
    </div>
  );
};

export default Support;
