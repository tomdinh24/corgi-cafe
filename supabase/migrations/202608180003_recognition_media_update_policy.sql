-- Corgi Cafe — let a member re-record a recognition photo (retake).
--
-- recognition_media had only INSERT/SELECT/DELETE policies. The upload route upserts the media
-- row (onConflict recommendation_id,member_id,media_kind), so a *retake* becomes an ON CONFLICT
-- UPDATE — which was denied for lack of an UPDATE policy. Add an owner-scoped UPDATE policy with
-- the same "must have chosen continue" gate as insert.
--
-- (The separate storage-object failure — uploads were sent with upsert, which storage evaluates
-- against an UPDATE policy the bucket never had, so even first uploads were rejected — is fixed in
-- the API route by dropping upsert, since each upload already uses a unique Date.now() path.)
create policy recognition_owner_update on public.recognition_media for update
using (member_id = auth.uid())
with check (
  member_id = auth.uid()
  and exists (
    select 1 from public.introduction_participants p
    where p.recommendation_id = recognition_media.recommendation_id
      and p.member_id = auth.uid()
      and p.private_decision = 'continue'
  )
);
