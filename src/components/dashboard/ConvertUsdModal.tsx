import { useEffect, useState } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  usdBalance: number;
  cardName?: string;
}

export default function ConvertUsdModal({ open, onClose, usdBalance, cardName = "" }: Props) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [rate, setRate] = useState<number>(90);
  const [feePercent, setFeePercent] = useState<number>(1);
  const [minUsd, setMinUsd] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setComment("");
    (async () => {
      const { data: globalData } = await supabase
        .from("compliance_settings")
        .select("usd_rub_rate, conversion_fee_percent, min_conversion_usd")
        .limit(1)
        .maybeSingle();
      let r = Number((globalData as any)?.usd_rub_rate) || 90;
      let f = Number((globalData as any)?.conversion_fee_percent) || 0;
      let m = Number((globalData as any)?.min_conversion_usd) || 0;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("compliance_prices")
          .eq("user_id", user.id)
          .maybeSingle();
        const cp = (profile as any)?.compliance_prices;
        if (cp && typeof cp === "object") {
          if (cp.usd_rub_rate != null && !isNaN(Number(cp.usd_rub_rate))) r = Number(cp.usd_rub_rate);
          if (cp.conversion_fee_percent != null && !isNaN(Number(cp.conversion_fee_percent))) f = Number(cp.conversion_fee_percent);
          if (cp.min_conversion_usd != null && !isNaN(Number(cp.min_conversion_usd))) m = Number(cp.min_conversion_usd);
        }
      }
      setRate(r);
      setFeePercent(f);
      setMinUsd(m);
    })();
    if (user?.id) {
      supabase
        .from("conversion_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1)
        .then(({ data }) => setHasPending(Boolean(data && data.length)));
    }
  }, [open, user?.id]);

  const amountNum = Number(amount.replace(",", ".")) || 0;
  const fee = (amountNum * feePercent) / 100;
  // Комиссия оплачивается отдельно через МИР, поэтому к зачислению идёт полная сумма по курсу
  const amountRub = amountNum * rate;

  const submit = async () => {
    if (!user?.id) return;
    if (amountNum <= 0) return toast.error("Введите сумму");
    if (minUsd > 0 && amountNum < minUsd) {
      return toast.error(`Минимальная сумма конвертации: $${minUsd}`);
    }
    if (amountNum > usdBalance) return toast.error("Сумма превышает баланс");
    if (hasPending) return toast.error("У вас уже есть заявка на рассмотрении");
    setSubmitting(true);
    const { error } = await supabase.from("conversion_requests").insert({
      user_id: user.id,
      amount_usd: amountNum,
      rate,
      fee_percent: feePercent,
      amount_rub: Number(amountRub.toFixed(2)),
      card_name: cardName,
      comment: comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось отправить заявку");
      return;
    }
    toast.success("Заявка на конвертацию отправлена");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground text-lg font-bold">Конвертация USD → RUB</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-secondary rounded-xl p-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Курс банка</span>
            <span className="text-foreground font-semibold">1 $ = {rate.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ₽</span>
          </div>

          {minUsd > 0 && (
            <div className="bg-secondary/60 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Минимальная сумма</span>
              <span className="text-foreground font-semibold">${minUsd.toLocaleString("en-US")}</span>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Сумма к конвертации (USD)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0.00"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-lg font-semibold pr-12 outline-none focus:border-primary"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-muted-foreground">
                Доступно: ${usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={() => setAmount(String(usdBalance))}
                className="text-primary hover:underline"
              >
                Всё
              </button>
            </div>
            {minUsd > 0 && amountNum > 0 && amountNum < minUsd && (
              <p className="text-xs text-red-500 mt-1">Минимум для конвертации: ${minUsd}</p>
            )}
          </div>

          <div className="bg-secondary/60 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between pt-1">
              <span className="text-foreground font-medium flex items-center gap-1">К зачислению <ArrowRight className="w-3 h-3" /></span>
              <span className="text-primary font-bold text-base">
                {amountRub > 0 ? amountRub.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} ₽
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Комиссия оплачивается отдельно</p>
            <p>
              Комиссия за конвертацию ({feePercent}%) — <span className="font-semibold">${fee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> — оплачивается отдельно через платёжный шлюз <span className="font-semibold">МИР</span> после подтверждения заявки администратором. Реквизиты для оплаты будут отправлены вам менеджером.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Комментарий (необязательно)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-foreground text-sm outline-none focus:border-primary resize-none"
              placeholder="Например, для срочного перевода"
            />
          </div>

          {hasPending && (
            <div className="text-xs text-amber-500 bg-amber-500/10 rounded-lg p-2">
              У вас уже есть заявка на рассмотрении. Дождитесь решения администратора.
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || amountNum <= 0 || amountNum > usdBalance || hasPending}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Отправить заявку
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Заявка будет рассмотрена администратором. После подтверждения средства поступят на рублёвый счёт.
          </p>
        </div>
      </div>
    </div>
  );
}