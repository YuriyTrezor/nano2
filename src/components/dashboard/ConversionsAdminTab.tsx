import { ArrowLeftRight } from "lucide-react";
import ConversionRequestsAdmin from "@/components/dashboard/ConversionRequestsAdmin";

const ConversionsAdminTab = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ArrowLeftRight className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заявки на конвертацию</h1>
          <p className="text-muted-foreground text-sm">USD → RUB. Подтверждение или отклонение запросов клиентов.</p>
        </div>
      </div>
      <ConversionRequestsAdmin />
    </div>
  );
};

export default ConversionsAdminTab;