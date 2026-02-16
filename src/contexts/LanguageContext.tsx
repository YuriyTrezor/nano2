import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "ru" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Sidebar
  "Обзор": { ru: "Обзор", en: "Overview" },
  "Переводы": { ru: "Переводы", en: "Transfers" },
  "Карты": { ru: "Карты", en: "Cards" },
  "Вклады": { ru: "Вклады", en: "Deposits" },
  "Кредиты": { ru: "Кредиты", en: "Credits" },
  "Админ-панель": { ru: "Админ-панель", en: "Admin Panel" },
  "Обращения": { ru: "Обращения", en: "Support" },
  "Настройки": { ru: "Настройки", en: "Settings" },
  "Поддержка": { ru: "Поддержка", en: "Help" },
  "Выйти": { ru: "Выйти", en: "Sign Out" },
  "Онлайн-банкинг": { ru: "Онлайн-банкинг", en: "Online Banking" },
  "Админ": { ru: "Админ", en: "Admin" },
  "Ещё": { ru: "Ещё", en: "More" },

  // Overview
  "Добро пожаловать": { ru: "Добро пожаловать", en: "Welcome" },
  "Вот обзор ваших финансов": { ru: "Вот обзор ваших финансов", en: "Here's your financial overview" },
  "Общий баланс": { ru: "Общий баланс", en: "Total Balance" },
  "за последний месяц": { ru: "за последний месяц", en: "last month" },
  "Последние операции": { ru: "Последние операции", en: "Recent Transactions" },
  "ДЕБЕТОВАЯ КАРТА": { ru: "ДЕБЕТОВАЯ КАРТА", en: "DEBIT CARD" },
  "ВЛАДЕЛЕЦ": { ru: "ВЛАДЕЛЕЦ", en: "CARDHOLDER" },
  "СРОК": { ru: "СРОК", en: "EXPIRES" },
  "Быстрые действия": { ru: "Быстрые действия", en: "Quick Actions" },
  "Перевод": { ru: "Перевод", en: "Transfer" },
  "Пополнить": { ru: "Пополнить", en: "Top Up" },
  "Оплатить": { ru: "Оплатить", en: "Pay" },
  "Мои счета": { ru: "Мои счета", en: "My Accounts" },
  "Основной счёт": { ru: "Основной счёт", en: "Main Account" },

  // Admin
  "Панель администратора": { ru: "Панель администратора", en: "Admin Panel" },
  "Полное управление клиентами и финансами": { ru: "Полное управление клиентами и финансами", en: "Full client and finance management" },
  "Создать пользователя": { ru: "Создать пользователя", en: "Create User" },
  "Клиенты": { ru: "Клиенты", en: "Clients" },
  "Email": { ru: "Email", en: "Email" },
  "Имя": { ru: "Имя", en: "Name" },
  "Баланс": { ru: "Баланс", en: "Balance" },
  "Статус": { ru: "Статус", en: "Status" },
  "Дата": { ru: "Дата", en: "Date" },
  "Действия": { ru: "Действия", en: "Actions" },
  "Активен": { ru: "Активен", en: "Active" },
  "Заблокирован": { ru: "Заблокирован", en: "Blocked" },
  "Карта": { ru: "Карта", en: "Card" },
  "Операция": { ru: "Операция", en: "Transaction" },
  "Разбл.": { ru: "Разбл.", en: "Unblock" },
  "Блок.": { ru: "Блок.", en: "Block" },
  "Сессии": { ru: "Сессии", en: "Sessions" },
  "Операции": { ru: "Операции", en: "Operations" },
  "Удалить": { ru: "Удалить", en: "Delete" },

  // Support
  "Обращения клиентов": { ru: "Обращения клиентов", en: "Customer Support" },
  "Сообщения из чата поддержки": { ru: "Сообщения из чата поддержки", en: "Support chat messages" },
  "Диалоги": { ru: "Диалоги", en: "Dialogs" },
  "Выберите диалог": { ru: "Выберите диалог", en: "Select a dialog" },
  "Чат загружен": { ru: "Чат загружен", en: "Chat loaded" },
  "Новое обращение": { ru: "Новое обращение", en: "New Request" },
  "Введите сообщение...": { ru: "Введите сообщение...", en: "Enter message..." },
  "Отправить": { ru: "Отправить", en: "Send" },

  // Language
  "RU": { ru: "RU", en: "EN" },

  // Dialogs
  "Подтвердите удаление": { ru: "Подтвердите удаление", en: "Confirm Deletion" },
  "Вы уверены, что хотите удалить этого клиента?": { ru: "Вы уверены, что хотите удалить этого клиента?", en: "Are you sure you want to delete this client?" },
  "Отмена": { ru: "Отмена", en: "Cancel" },
  "Редактировать имя": { ru: "Редактировать имя", en: "Edit Name" },
  "Сохранить": { ru: "Сохранить", en: "Save" },
  "Пароль": { ru: "Пароль", en: "Password" },
  "Создать": { ru: "Создать", en: "Create" },
  "Информация": { ru: "Информация", en: "Information" },
};

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("ru");

  const toggleLang = () => setLang(prev => prev === "ru" ? "en" : "ru");

  const t = (key: string): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
