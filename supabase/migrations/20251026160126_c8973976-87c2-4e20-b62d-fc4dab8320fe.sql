-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-images',
  'meal-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meal images
CREATE POLICY "Allow authenticated users to upload meal images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to view their own meal images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public access to meal images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'meal-images');