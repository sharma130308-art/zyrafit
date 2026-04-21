
-- Make the food-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'food-photos';

-- Drop any existing overly-permissive policies on food-photos objects
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%food-photos%' OR with_check ILIKE '%food-photos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Per-user SELECT
CREATE POLICY "Users can view their own food photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Per-user INSERT
CREATE POLICY "Users can upload their own food photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Per-user UPDATE
CREATE POLICY "Users can update their own food photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Per-user DELETE
CREATE POLICY "Users can delete their own food photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
