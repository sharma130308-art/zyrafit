-- Add photo_url column to food_entries
ALTER TABLE public.food_entries ADD COLUMN photo_url text;

-- Create storage bucket for food photos
INSERT INTO storage.buckets (id, name, public) VALUES ('food-photos', 'food-photos', true);

-- Allow authenticated users to upload to food-photos bucket
CREATE POLICY "Users can upload food photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to food photos
CREATE POLICY "Public read access for food photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'food-photos');