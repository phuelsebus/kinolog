-- KinoLog storage setup: privater Bucket fuer Ticketbilder.
-- Pfadkonvention: <user_id>/<beliebiger dateiname>, z.B. <user_id>/<uuid>.jpg
-- RLS stellt sicher, dass ein Nutzer nur auf Objekte in seinem eigenen
-- "Ordner" (erstes Pfadsegment == eigene user_id) zugreifen kann.

insert into storage.buckets (id, name, public)
values ('ticket-images', 'ticket-images', false)
on conflict (id) do nothing;

create policy "ticket_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ticket-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ticket_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ticket-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ticket_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ticket-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'ticket-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ticket_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ticket-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
