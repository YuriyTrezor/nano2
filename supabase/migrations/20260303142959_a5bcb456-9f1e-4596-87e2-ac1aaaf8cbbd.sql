
-- Allow admins to delete support messages
CREATE POLICY "Admins can delete messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete support tickets
CREATE POLICY "Admins can delete tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true);

-- Allow authenticated users to upload files to support-attachments
CREATE POLICY "Authenticated users can upload support files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

-- Allow anyone to read support attachment files
CREATE POLICY "Anyone can read support attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'support-attachments');

-- Allow admins to delete support attachment files
CREATE POLICY "Admins can delete support attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));
