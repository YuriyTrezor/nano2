DELETE FROM public.transactions
WHERE user_id = '56765083-7394-47e9-8abe-9b858578c3a2'
  AND (UPPER(category) LIKE '%USD%' OR UPPER(title) LIKE '%USD%' OR title LIKE '%$%');