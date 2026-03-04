
-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  doc_file_url TEXT,
  selfie_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own verification" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own verification" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all verifications" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update status
CREATE POLICY "Admins can update verifications" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete verifications" ON public.verification_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users can upload verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own files
CREATE POLICY "Users can view own verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all verification docs
CREATE POLICY "Admins can view all verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'));
