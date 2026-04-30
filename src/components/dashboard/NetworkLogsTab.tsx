import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NetLog {
  id: string;
  created_at: string;
  email: string | null;
  url: string;
  method: string;
  route: string | null;
  error_type: string;
  status: number | null;
  message: string | null;
  user_agent: string | null;
  region_hint: string | null;
}

const typeColor: Record<string, string> = {
  timeout: "text-orange-400 bg-orange-400/10",
  network: "text-red-400 bg-red-400/10",
  cors: "text-purple-400 bg-purple-400/10",
  http_error: "text-yellow-400 bg-yellow-400/10",
  other: "text-muted-foreground bg-muted/30",
};

const NetworkLogsTab = () => {
  const [logs, setLogs] = useState<NetLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("network_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Не удалось загрузить логи");
    } else {
      setLogs((data ?? []) as NetLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const clearOld = async () => {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const { error } = await supabase.from("network_logs").delete().lt("created_at", cutoff);
    if (error) toast.error("Не удалось очистить");
    else {
      toast.success("Старые записи удалены");
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            Сетевые ошибки
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Жалобы клиентов на доступ (timeout, CORS, неудачные POST). Последние 500 записей.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="outline" size="sm" onClick={clearOld}>
            <Trash2 className="w-4 h-4 mr-1" />
            Очистить &gt;7 дней
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border">
          Ошибок нет. 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div
              key={l.id}
              className="bg-card border border-border rounded-xl p-3 text-sm space-y-1"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      typeColor[l.error_type] ?? typeColor.other
                    }`}
                  >
                    {l.error_type}
                    {l.status ? ` ${l.status}` : ""}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{l.method}</span>
                  <span className="text-xs text-muted-foreground">{l.route ?? "?"}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("ru-RU")}
                </span>
              </div>
              <div className="font-mono text-xs break-all text-foreground/80">{l.url}</div>
              {l.message && (
                <div className="text-xs text-muted-foreground break-all">{l.message}</div>
              )}
              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                {l.region_hint && <span>📍 {l.region_hint}</span>}
                {l.user_agent && <span className="truncate max-w-md">🖥 {l.user_agent}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkLogsTab;