import { ShieldCheck, Eye, CheckCircle2, XCircle, Clock, Download, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  birth_date: string;
  doc_number: string;
  doc_file_url: string | null;
  selfie_file_url: string | null;
  status: string;
  created_at: string;
  email?: string;
}

const AdminVerificationsTab = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<{ url: string; title: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("verification_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const reqs = (data as any[]) || [];

    // Fetch emails for each user
    const userIds = [...new Set(reqs.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setRequests(reqs.map(r => ({
      ...r,
      email: profileMap.get(r.user_id)?.email || r.user_id.slice(0, 8),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(path, 300);
    return data?.signedUrl || null;
  };

  const handleViewFile = async (path: string | null, title: string) => {
    if (!path) {
      toast({ title: "Ошибка", description: "Файл не загружен", variant: "destructive" });
      return;
    }
    const url = await getSignedUrl(path);
    if (url) {
      setViewDoc({ url, title });
    } else {
      toast({ title: "Ошибка", description: "Не удалось получить файл", variant: "destructive" });
    }
  };

  const handleDownload = async (path: string | null) => {
    if (!path) return;
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("verification_requests" as any)
      .update({ status } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast({ title: "Успешно", description: `Статус обновлён: ${status === "approved" ? "Подтверждено" : "Отклонено"}` });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("verification_requests" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setRequests(prev => prev.filter(r => r.id !== id));
    toast({ title: "Успешно", description: "Заявка удалена" });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-medium">Подтверждено</span>;
      case "rejected": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">Отклонено</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">На проверке</span>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Верификации</h1>
            <p className="text-muted-foreground text-sm">Заявки клиентов на верификацию</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      {requests.length === 0 && !loading && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Нет заявок на верификацию</p>
        </div>
      )}

      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-foreground font-semibold">{req.full_name}</span>
                  {statusBadge(req.status)}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Email: <span className="text-foreground">{req.email}</span></span>
                  <span>Дата рождения: <span className="text-foreground">{req.birth_date}</span></span>
                  <span>Паспорт: <span className="text-foreground">{req.doc_number}</span></span>
                  <span>Дата подачи: <span className="text-foreground">{new Date(req.created_at).toLocaleString("ru-RU")}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleViewFile(req.doc_file_url, "Документ")}
                  className="p-1.5 text-xs bg-secondary text-muted-foreground hover:text-foreground rounded px-2 py-1 flex items-center gap-1"
                  title="Просмотр документа"
                >
                  <Eye className="w-3 h-3" /> Док.
                </button>
                <button
                  onClick={() => handleViewFile(req.selfie_file_url, "Селфи")}
                  className="p-1.5 text-xs bg-secondary text-muted-foreground hover:text-foreground rounded px-2 py-1 flex items-center gap-1"
                  title="Просмотр селфи"
                >
                  <Eye className="w-3 h-3" /> Селфи
                </button>
                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "approved")}
                      className="p-1.5 text-xs bg-green-500/20 text-green-500 rounded px-2 py-1 flex items-center gap-1 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Принять
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, "rejected")}
                      className="p-1.5 text-xs bg-destructive/20 text-destructive rounded px-2 py-1 flex items-center gap-1 font-medium"
                    >
                      <XCircle className="w-3 h-3" /> Отклонить
                    </button>
                  </>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 text-xs bg-destructive/20 text-destructive rounded px-2 py-1 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
                      <AlertDialogDescription>Заявка на верификацию от {req.full_name} будет удалена.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(req.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* File viewer dialog */}
      <Dialog open={!!viewDoc} onOpenChange={open => !open && setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {viewDoc?.title}
              <Button variant="outline" size="sm" onClick={() => viewDoc && window.open(viewDoc.url, "_blank")} className="gap-1">
                <Download className="w-3.5 h-3.5" /> Скачать
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[65vh] overflow-auto">
            {viewDoc?.url && (
              viewDoc.url.includes(".pdf") ? (
                <iframe src={viewDoc.url} className="w-full h-[60vh] rounded-lg" />
              ) : (
                <img src={viewDoc.url} alt={viewDoc.title} className="max-w-full max-h-[60vh] rounded-lg object-contain" />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationsTab;
