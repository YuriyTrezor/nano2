export type TxCurrency = "RUB" | "USD";

export const USD_MARKER = "USD";

export const getTxCurrency = (tx: { category?: string | null; title?: string | null }): TxCurrency => {
  const cat = (tx.category || "").toUpperCase();
  const title = (tx.title || "").toUpperCase();
  // Если в названии/категории явно указаны рубли — это RUB,
  // даже если рядом упомянут $ (например, «10 000 $ × 90 ₽ = 902 000 ₽»)
  if ((tx.title || "").includes("₽") || (tx.category || "").includes("₽") || cat.includes("RUB") || title.includes("RUB")) return "RUB";
  if (cat.includes("USD") || title.includes("USD") || (tx.title || "").includes("$")) return "USD";
  return "RUB";
};

export const formatTxAmount = (tx: { amount: number; category?: string | null; title?: string | null }) => {
  const cur = getTxCurrency(tx);
  const symbol = cur === "USD" ? "$" : "₽";
  const prefix = tx.amount >= 0 ? "+" : "";
  if (cur === "USD") {
    return `${prefix}${symbol}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${prefix}${tx.amount.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ${symbol}`;
};
