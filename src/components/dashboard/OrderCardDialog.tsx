import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ChevronRight, ChevronLeft, MapPin, User, Truck, CreditCard, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OrderCardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cardName: string;
  onSubmitted?: () => void;
}

const DELIVERY_SERVICES = [
  { id: "neobank", name: "Курьерская доставка NeoBank", desc: "1–2 дня • Бесплатно", color: "from-primary/30 to-primary/10", types: ["courier"], featured: true },
  { id: "cdek", name: "СДЭК", desc: "1–4 дня • от 1 050 ₽", color: "from-emerald-500/20 to-emerald-700/10", types: ["courier", "pickup"] },
  { id: "boxberry", name: "Boxberry", desc: "2–5 дней • от 870 ₽", color: "from-orange-500/20 to-orange-700/10", types: ["courier", "pickup"] },
  { id: "post", name: "Почта России", desc: "3–10 дней • от 600 ₽", color: "from-blue-500/20 to-blue-700/10", types: ["courier", "pickup"] },
  { id: "yandex", name: "Яндекс Доставка", desc: "В день заказа • от 1 350 ₽", color: "from-yellow-500/20 to-yellow-700/10", types: ["courier"] },
  { id: "dpd", name: "DPD", desc: "1–3 дня • от 1 200 ₽", color: "from-red-500/20 to-red-700/10", types: ["courier", "pickup"] },
  { id: "5post", name: "5Post (Пятёрочка)", desc: "2–5 дней • от 597 ₽", color: "from-rose-500/20 to-rose-700/10", types: ["pickup"] },
];

const STEPS = [
  { id: 1, label: "Личные данные", icon: User },
  { id: 2, label: "Адрес", icon: MapPin },
  { id: 3, label: "Доставка", icon: Truck },
  { id: 4, label: "Подтверждение", icon: Check },
];

const OrderCardDialog = ({ open, onOpenChange, cardName, onSubmitted }: OrderCardDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    passport: "",
    country: "Россия",
    region: "",
    city: "",
    postalCode: "",
    addressLine: "",
    deliveryService: "neobank",
    deliveryType: "courier",
    pickupPoint: "",
    comment: "",
  });

  useEffect(() => {
    if (open && user) {
      setForm(f => ({
        ...f,
        fullName: f.fullName || `${user.user_metadata?.display_name ?? ""} ${user.user_metadata?.last_name ?? ""}`.trim(),
        email: f.email || user.email || "",
        phone: f.phone || user.user_metadata?.phone || "",
      }));
    }
    if (!open) {
      setTimeout(() => { setStep(1); setSuccess(false); }, 300);
    }
  }, [open, user]);

  const upd = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = (s: number): boolean => {
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.trim().length < 3) { toast.error("Укажите ФИО"); return false; }
      if (!form.phone.trim() || form.phone.length < 6) { toast.error("Укажите телефон"); return false; }
      if (!form.passport.trim()) { toast.error("Укажите серию и номер паспорта"); return false; }
    }
    if (s === 2) {
      if (!form.city.trim()) { toast.error("Укажите город"); return false; }
      if (!form.addressLine.trim()) { toast.error("Укажите адрес"); return false; }
    }
    if (s === 3) {
      if (!form.deliveryService) { toast.error("Выберите службу доставки"); return false; }
      if (form.deliveryType === "pickup" && !form.pickupPoint.trim()) { toast.error("Укажите пункт выдачи"); return false; }
    }
    return true;
  };

  const next = () => { if (validate(step)) setStep(s => Math.min(4, s + 1)); };
  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("card_orders").insert({
      user_id: user.id,
      card_name: cardName,
      full_name: form.fullName,
      phone: form.phone,
      email: form.email || null,
      passport: form.passport,
      country: form.country,
      region: form.region || null,
      city: form.city,
      postal_code: form.postalCode || null,
      address_line: form.addressLine,
      delivery_service: form.deliveryService,
      delivery_type: form.deliveryType,
      pickup_point: form.pickupPoint || null,
      comment: form.comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    setSuccess(true);
    onSubmitted?.();
  };

  const selectedService = DELIVERY_SERVICES.find(s => s.id === form.deliveryService);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5 ring-8 ring-primary/5">
              <Check className="w-10 h-10 text-primary" strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Заявка принята!</h3>
            <p className="text-muted-foreground text-sm mb-1">Ваша заявка на пластиковую карту <span className="text-foreground font-semibold">{cardName}</span> отправлена.</p>
            <p className="text-muted-foreground text-sm mb-6">Менеджер свяжется с вами в течение 24 часов для подтверждения деталей.</p>
            <div className="bg-secondary/40 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-foreground">Доставка</span></div>
              <p className="text-xs text-muted-foreground">{selectedService?.name} • {form.deliveryType === "courier" ? "Курьер" : "Пункт выдачи"}</p>
              <p className="text-xs text-muted-foreground mt-1">{form.city}, {form.addressLine}</p>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Готово</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-border">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" />
                Заказ пластиковой карты <span className="text-primary">{cardName}</span>
              </DialogTitle>
              {/* Stepper */}
              <div className="flex items-center justify-between mt-4 px-1">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isDone = step > s.id;
                  const isActive = step === s.id;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone ? "bg-primary border-primary text-primary-foreground" :
                          isActive ? "border-primary text-primary bg-primary/10" :
                          "border-border text-muted-foreground"
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-[10px] hidden sm:block ${isActive || isDone ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div>
                    <Label className="text-xs">ФИО (как в паспорте)</Label>
                    <Input value={form.fullName} onChange={e => upd("fullName", e.target.value)} placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Телефон</Label>
                      <Input value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="+7 999 123 45 67" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input value={form.email} onChange={e => upd("email", e.target.value)} placeholder="you@mail.com" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Серия и номер паспорта</Label>
                    <Input value={form.passport} onChange={e => upd("passport", e.target.value)} placeholder="4510 123456" />
                    <p className="text-[10px] text-muted-foreground mt-1">Используется только для идентификации согласно требованиям банка.</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Страна</Label>
                      <Input value={form.country} onChange={e => upd("country", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Регион / Область</Label>
                      <Input value={form.region} onChange={e => upd("region", e.target.value)} placeholder="Московская область" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Город</Label>
                      <Input value={form.city} onChange={e => upd("city", e.target.value)} placeholder="Москва" />
                    </div>
                    <div>
                      <Label className="text-xs">Индекс</Label>
                      <Input value={form.postalCode} onChange={e => upd("postalCode", e.target.value)} placeholder="101000" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Адрес (улица, дом, квартира)</Label>
                    <Input value={form.addressLine} onChange={e => upd("addressLine", e.target.value)} placeholder="ул. Тверская, д. 12, кв. 45" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div>
                    <Label className="text-xs mb-2 block">Способ получения</Label>
                    <RadioGroup value={form.deliveryType} onValueChange={v => upd("deliveryType", v)} className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.deliveryType === "courier" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="courier" />
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm">Курьер до двери</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.deliveryType === "pickup" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value="pickup" />
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-sm">Пункт выдачи</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">Служба доставки</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DELIVERY_SERVICES.filter(s => s.types.includes(form.deliveryType)).map(s => {
                        const selected = form.deliveryService === s.id;
                        const featured = (s as any).featured;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => upd("deliveryService", s.id)}
                            className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${featured ? "sm:col-span-2" : ""} ${
                              selected ? "border-primary ring-2 ring-primary/40" : featured ? "border-primary/60 hover:border-primary" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} ${featured ? "opacity-90" : "opacity-60"}`} />
                            {featured && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse pointer-events-none" />}
                            <div className="relative flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                {featured && (
                                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-semibold text-foreground ${featured ? "text-sm" : "text-sm"}`}>{s.name}</span>
                                    {featured && (
                                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                                        Рекомендуем
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[11px] mt-0.5 ${featured ? "text-foreground/70" : "text-muted-foreground"}`}>{s.desc}</p>
                                </div>
                              </div>
                              {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.deliveryType === "pickup" && (
                    <div>
                      <Label className="text-xs">Адрес пункта выдачи</Label>
                      <Input value={form.pickupPoint} onChange={e => upd("pickupPoint", e.target.value)} placeholder="Например: ул. Ленина, д. 5" />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Комментарий (необязательно)</Label>
                    <Textarea value={form.comment} onChange={e => upd("comment", e.target.value)} placeholder="Удобное время доставки, пожелания…" rows={2} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Карта</span>
                    </div>
                    <p className="text-foreground font-bold">{cardName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-foreground">Получатель</span></div>
                    <p className="text-sm text-foreground">{form.fullName}</p>
                    <p className="text-xs text-muted-foreground">{form.phone} • {form.email}</p>
                    <p className="text-xs text-muted-foreground">Паспорт: {form.passport}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-foreground">Адрес</span></div>
                    <p className="text-sm text-foreground">{form.country}{form.region && `, ${form.region}`}, {form.city}</p>
                    <p className="text-xs text-muted-foreground">{form.addressLine}{form.postalCode && ` • ${form.postalCode}`}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-foreground">Доставка</span></div>
                    <p className="text-sm text-foreground">{selectedService?.name} • {form.deliveryType === "courier" ? "Курьер до двери" : "Пункт выдачи"}</p>
                    {form.pickupPoint && <p className="text-xs text-muted-foreground">{form.pickupPoint}</p>}
                    <p className="text-xs text-muted-foreground">{selectedService?.desc}</p>
                  </div>
                  {form.comment && (
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="text-xs font-semibold text-foreground mb-1">Комментарий</p>
                      <p className="text-xs text-muted-foreground">{form.comment}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground text-center pt-2">
                    Нажимая «Подтвердить заказ», вы соглашаетесь с условиями выпуска и доставки карты.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-6 pt-2 border-t border-border bg-card sticky bottom-0">
              {step > 1 && (
                <Button variant="outline" onClick={back} disabled={submitting} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={next} className="flex-1">
                  Далее <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting} className="flex-1">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Отправка…</> : <><Check className="w-4 h-4 mr-1" /> Подтвердить заказ</>}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderCardDialog;