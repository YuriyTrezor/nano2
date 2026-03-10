import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

export interface BalanceTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  card_name: string;
  created_at: string;
}

export const fetchAllUserTransactions = async <T = BalanceTransaction>(
  userId: string,
  selectColumns = "id, title, category, amount, card_name, created_at"
): Promise<T[]> => {
  const allTransactions: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select(selectColumns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allTransactions.push(...(data as T[]));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allTransactions;
};
