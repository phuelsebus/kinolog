-- Profilbild: Spalte fuer den Storage-Pfad plus privater Bucket, gleiches
-- Muster wie ticket-images (siehe 20260813120000_ticket_images_storage.sql).
-- Pfadkonvention bewusst OHNE Dateiname-Variation: <user_id>/avatar (kein
-- Suffix), Upsert beim Hochladen ersetzt ein vorhandenes Profilbild statt
-- alte Versionen verwaist liegen zu lassen.
alter table public.profiles add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
