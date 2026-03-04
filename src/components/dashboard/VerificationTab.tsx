import { ShieldCheck, Upload, CheckCircle2, Clock, AlertTriangle, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { label: "Личные данные", description: "ФИО и дата рождения" },
  { label: "Документ", description: "Паспорт или ID-карта" },
  { label: "Селфи", description: "Фото с документом" },
];

const VerificationTab = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      const { data } = await supabase
        .from("verification_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && (data as any[]).length > 0) {
        setExistingRequest((data as any[])[0]);
      }
      setLoading(false);
    };
    fetchExisting();
  }, [user]);

  const handleFileSelect = (type: "doc" | "selfie") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 10 МБ");
      return;
    }
    if (type === "doc") {
      setDocFile(file);
      if (currentStep < 2) setCurrentStep(2);
    } else {
      setSelfieFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Необходимо авторизоваться");
      return;
    }
    if (!fullName.trim() || !birthDate.trim() || !docNumber.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    if (!docFile) {
      toast.error("Загрузите фото документа");
      return;
    }
    if (!selfieFile) {
      toast.error("Загрузите селфи с документом");
      return;
    }

    setUploading(true);
    try {
      // Upload document photo
      const docExt = docFile.name.split(".").pop();
      const docPath = `${user.id}/document_${Date.now()}.${docExt}`;
      const { error: docErr } = await supabase.storage
        .from("verification-documents")
        .upload(docPath, docFile);
      if (docErr) throw docErr;

      // Upload selfie
      const selfieExt = selfieFile.name.split(".").pop();
      const selfiePath = `${user.id}/selfie_${Date.now()}.${selfieExt}`;
      const { error: selfieErr } = await supabase.storage
        .from("verification-documents")
        .upload(selfiePath, selfieFile);
      if (selfieErr) throw selfieErr;

      // Save to DB
      const { error: dbErr } = await supabase
        .from("verification_requests" as any)
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          birth_date: birthDate.trim(),
          doc_number: docNumber.trim(),
          doc_file_url: docPath,
          selfie_file_url: selfiePath,
          status: "pending",
        } as any);
      if (dbErr) throw dbErr;

      setExistingRequest({
        full_name: fullName,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      toast.success("Заявка на верификацию отправлена. Ожидайте проверки.");
    } catch (err: any) {
      console.error(err);
      toast.error("Ошибка при отправке: " + (err.message || "Попробуйте позже"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (existingRequest) {
    const statusMap: Record<string, { icon: any; label: string; color: string }> = {
      pending: { icon: Clock, label: "На проверке", color: "text-primary" },
      approved: { icon: CheckCircle2, label: "Подтверждено", color: "text-green-500" },
      rejected: { icon: AlertTriangle, label: "Отклонено", color: "text-destructive" },
    };
    const st = statusMap[existingRequest.status] || statusMap.pending;
    const StatusIcon = st.icon;

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Верификация</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className={`w-16 h-16 rounded-full ${st.color === "text-green-500" ? "bg-green-500/20" : st.color === "text-destructive" ? "bg-destructive/20" : "bg-primary/20"} flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-8 h-8 ${st.color}`} />
          </div>
          <h2 className="text-foreground font-bold text-xl mb-2">{st.label}</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {existingRequest.status === "pending" && "Ваши данные находятся на проверке. Это может занять до 24 часов. Мы уведомим вас о результате."}
            {existingRequest.status === "approved" && "Ваша личность подтверждена. Все функции доступны."}
            {existingRequest.status === "rejected" && "Ваша заявка была отклонена. Пожалуйста, обратитесь в поддержку."}
          </p>
          <div className="flex items-center gap-2 justify-center text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Подано: {new Date(existingRequest.created_at).toLocaleString("ru-RU")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Верификация</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Подтвердите вашу личность для полного доступа к услугам</p>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8 max-w-lg">
        {steps.map((step, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-2 ${i <= currentStep ? "bg-primary" : "bg-secondary"}`} />
            <p className={`text-xs font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
            <p className="text-[10px] text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-lg space-y-6">
        {/* Step 1: Personal data */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            Личные данные
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">ФИО полностью</label>
              <Input
                placeholder="Иванов Иван Иванович"
                value={fullName}
                onChange={e => { setFullName(e.target.value); if (currentStep < 1) setCurrentStep(1); }}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Дата рождения</label>
              <Input
                placeholder="01.01.1990"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Document */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>2</span>
            Документ, удостоверяющий личность
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Серия и номер паспорта</label>
              <Input
                placeholder="0000 000000"
                value={docNumber}
                onChange={e => { setDocNumber(e.target.value); if (currentStep < 2) setCurrentStep(2); }}
                className="bg-secondary border-border"
              />
            </div>
            <input
              ref={docInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect("doc")}
            />
            <div
              onClick={() => docInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {docFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  <span className="text-foreground text-sm font-medium">{docFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setDocFile(null); }} className="p-1 hover:bg-secondary rounded">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Загрузите фото документа</p>
                  <p className="text-muted-foreground text-xs mt-1">JPG, PNG, PDF до 10 МБ</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Selfie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>3</span>
            Селфи с документом
          </h3>
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect("selfie")}
          />
          <div
            onClick={() => selfieInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {selfieFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-foreground text-sm font-medium">{selfieFile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setSelfieFile(null); }} className="p-1 hover:bg-secondary rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Загрузите селфи с раскрытым документом</p>
                <p className="text-muted-foreground text-xs mt-1">Лицо и данные документа должны быть чётко видны</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-xs">
            Ваши данные защищены и обрабатываются в соответствии с ФЗ-152 «О персональных данных». Мы не передаём информацию третьим лицам.
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={uploading} className="w-full h-12 text-base font-semibold">
          {uploading ? "Отправка..." : "Отправить на проверку"}
        </Button>
      </div>
    </div>
  );
};

export default VerificationTab;
