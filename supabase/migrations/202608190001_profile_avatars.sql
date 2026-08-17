-- Profile avatars. A single avatar_url on profiles holds EITHER an external image URL chosen
-- during onboarding (e.g. a LinkedIn profile photo surfaced by Exa) OR the public URL of a file
-- the member uploaded from account settings. Uploaded files live in a public `avatars` bucket so
-- a plain <img> renders them without a signed-URL round-trip; writes are owner-scoped by the first
-- path segment (the member's uid). Public read is fine — a profile photo is meant to be seen by
-- the people you're introduced to, unlike the private recognition-media used mid-meeting.

alter table public.profiles
  add column if not exists avatar_url text
  check (avatar_url is null or char_length(avatar_url) <= 2048);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'])
on conflict (id) do nothing;

create policy avatars_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy avatars_owner_update on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy avatars_owner_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
