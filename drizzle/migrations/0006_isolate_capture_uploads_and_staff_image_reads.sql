DROP POLICY "capture upload" ON storage.objects;
DROP POLICY "property image read" ON storage.objects;
CREATE POLICY "property image read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id='property-images'
  AND public.is_staff((SELECT auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id::text=(storage.foldername(name))[1]
      AND (p.broker_id=(SELECT auth.uid()) OR public.can_view_all((SELECT auth.uid())))
  )
);