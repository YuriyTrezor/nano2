import { Shield, UserPlus, Plus, Minus, CreditCard, Send, Eye, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const clients = [
  {
    email: "koltunov.1978@list.ru",
    name: "Колтунов Павел",
    balance: "₽ 787 663,00",
    status: "Активен",
    statusColor: "text-primary",
    date: "14.02.2026",
    blocked: false,
  },
  {
    email: "tory_york@mail.ru",
    name: "Владимир Анатольевич Гончаров",
    balance: "₽ 21 096 779,00",
    status: "Заблокирован",
    statusColor: "text-yellow-500",
    date: "16.02.2026",
    blocked: true,
  },
  {
    email: "yuriyzhuravlev2018@gmail.com",
    name: "Chargeback",
    balance: "₽ 124 350,00",
    status: "Активен",
    statusColor: "text-primary",
    date: "14.02.2026",
    blocked: false,
  },
];

const AdminTab = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Панель администратора</h1>
          </div>
          <p className="text-muted-foreground text-sm">Полное управление клиентами и финансами</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <UserPlus className="w-4 h-4" />
          Создать пользователя
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-foreground font-semibold mb-4">Клиенты ({clients.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left pb-3 font-medium">Email</th>
                <th className="text-left pb-3 font-medium">Имя</th>
                <th className="text-left pb-3 font-medium">Баланс</th>
                <th className="text-left pb-3 font-medium">Статус</th>
                <th className="text-left pb-3 font-medium">Дата</th>
                <th className="text-right pb-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{client.email}</td>
                  <td className="py-3 text-foreground">{client.name}</td>
                  <td className="py-3 text-foreground font-medium">{client.balance}</td>
                  <td className="py-3">
                    <span className={`${client.statusColor} text-xs font-medium`}>{client.status}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{client.date}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button className="p-1 text-muted-foreground hover:text-foreground" title="Добавить/Убавить">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-muted-foreground">/</span>
                      <button className="p-1 text-muted-foreground hover:text-foreground">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Карта
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Send className="w-3 h-3" /> Операция
                      </button>
                      <button className={`p-1.5 text-xs px-2 py-1 rounded font-medium ${client.blocked ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                        {client.blocked ? "Разбл." : "Блок."}
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Сессии
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        Операции
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 font-medium flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
