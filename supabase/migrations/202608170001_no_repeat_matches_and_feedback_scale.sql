-- Corgi Cafe — two fixes:
-- 1) request_introduction() only ever excluded candidates paired within the *current* active
--    session lifecycle (by session id). Every Cafe visit creates a new session row, so a member
--    could be re-matched with someone they already met on a prior visit. Add a member-pair
--    history check spanning all of a member's sessions, independent of status.
-- 2) private_feedback used a collapsed three-option scale (not_useful/okay/useful). Restore the
--    five-point scale from the approved design.

create or replace function public.request_introduction(target_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  my_session public.visit_intro_sessions%rowtype;
  best public.visit_intro_sessions%rowtype;
  existing_rec uuid;
  new_rec_id uuid;
  shared_topics text[];
  my_first text;
  their_first text;
  offer_to_me boolean;
  offer_from_me boolean;
  kind text;
  explanation text;
  evidence jsonb;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into my_session
  from public.visit_intro_sessions
  where id = target_session_id and member_id = me;

  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;

  if my_session.status <> 'searching' then
    select r.id into existing_rec
    from public.recommendations r
    where (r.requester_session_id = my_session.id or r.counterpart_session_id = my_session.id)
      and r.status in ('proposed', 'introduced', 'locating', 'met', 'completed')
    order by r.created_at desc
    limit 1;
    return existing_rec;
  end if;

  if my_session.expires_at <= now()
     or not my_session.order_confirmed_today
     or not my_session.at_cafe then
    return null;
  end if;

  select * into best
  from public.visit_intro_sessions c
  where c.member_id <> me
    and c.status = 'searching'
    and c.cafe_code = my_session.cafe_code
    and c.expires_at > now()
    and c.order_confirmed_today
    and c.at_cafe
    and c.boundaries = my_session.boundaries
    and not exists (
      select 1 from public.recommendations r
      where (r.requester_session_id = c.id or r.counterpart_session_id = c.id)
        and r.status in ('proposed', 'introduced', 'locating', 'met')
    )
    -- Never re-introduce two members who have already been paired on any past visit.
    and not exists (
      select 1
      from public.introduction_participants ip_me
      join public.introduction_participants ip_them
        on ip_them.recommendation_id = ip_me.recommendation_id
       and ip_them.member_id = c.member_id
      where ip_me.member_id = me
    )
  order by
    cardinality(array(select unnest(c.topics) intersect select unnest(my_session.topics))) desc,
    ( (case when my_session.useful_context is not null and c.offer_context is not null then 1 else 0 end)
    + (case when c.useful_context is not null and my_session.offer_context is not null then 1 else 0 end) ) desc,
    c.created_at asc,
    c.id asc
  limit 1;

  if best.id is null then
    return null;
  end if;

  shared_topics := array(select unnest(my_session.topics) intersect select unnest(best.topics));
  select first_name into my_first from public.profiles where member_id = me;
  select first_name into their_first from public.profiles where member_id = best.member_id;
  their_first := coalesce(their_first, 'someone here');

  offer_to_me   := my_session.useful_context is not null and best.offer_context is not null;
  offer_from_me := best.useful_context is not null and my_session.offer_context is not null;

  if offer_to_me and offer_from_me then
    kind := 'reciprocal_value';
  elsif offer_to_me or offer_from_me then
    kind := 'ask_offer';
  else
    kind := 'shared_goal';
  end if;

  if cardinality(shared_topics) > 0 then
    explanation := format('You and %s both want to talk about %s.', their_first, array_to_string(shared_topics, ', '));
  else
    explanation := format('You and %s are both here to meet one worthwhile person at Corgi today.', their_first);
  end if;
  if offer_to_me then
    explanation := explanation || format(' They mentioned they can offer: %s.', best.offer_context);
  end if;
  explanation := left(explanation, 800);

  evidence := jsonb_build_object(
    'shared_topics', to_jsonb(shared_topics),
    'reciprocity', jsonb_build_object('offer_to_me', offer_to_me, 'offer_from_me', offer_from_me),
    'compatibility_kind', kind
  );

  insert into public.recommendations
    (requester_session_id, counterpart_session_id, compatibility_kind, explanation, evidence, status, introduced_at)
  values
    (my_session.id, best.id, kind, explanation, evidence, 'introduced', now())
  returning id into new_rec_id;

  insert into public.introduction_participants (recommendation_id, member_id)
  values (new_rec_id, me), (new_rec_id, best.member_id);

  update public.visit_intro_sessions
    set status = 'introduced'
    where id in (my_session.id, best.id);

  return new_rec_id;
end;
$$;

-- Return evidence too, so the client can ground an AI-generated version of the reason in the
-- same confirmed facts as the deterministic explanation (never inventing new facts). The return
-- columns changed, so the old signature must be dropped before recreating it.
drop function if exists public.get_introduction_counterpart(uuid);
create function public.get_introduction_counterpart(target_recommendation_id uuid)
returns table (
  first_name text,
  role_title text,
  current_work text,
  introduction_reason text,
  evidence jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  select p.first_name, p.role_title, p.current_work, r.explanation, r.evidence
  from public.recommendations r
  join public.visit_intro_sessions candidate_session
    on candidate_session.id in (r.requester_session_id, r.counterpart_session_id)
  join public.profiles p on p.member_id = candidate_session.member_id
  where r.id = target_recommendation_id
    and candidate_session.member_id <> auth.uid()
    and r.status in ('introduced', 'locating', 'met', 'completed')
    and exists (
      select 1 from public.introduction_participants viewer
      where viewer.recommendation_id = r.id
        and viewer.member_id = auth.uid()
    );
$$;

-- Lets the waiting party's client poll its own session status cheaply (has it been paired by
-- someone else's request_introduction call yet?) without exposing anyone else's data.
create or replace function public.get_my_session_status(target_session_id uuid)
returns table (status text, recommendation_id uuid)
language sql
security definer
set search_path = ''
stable
as $$
  select s.status::text,
    (select r.id from public.recommendations r
     where (r.requester_session_id = s.id or r.counterpart_session_id = s.id)
       and r.status in ('proposed', 'introduced', 'locating', 'met', 'completed')
     order by r.created_at desc limit 1)
  from public.visit_intro_sessions s
  where s.id = target_session_id and s.member_id = auth.uid();
$$;

revoke all on function public.get_introduction_counterpart(uuid) from public;
grant execute on function public.get_introduction_counterpart(uuid) to authenticated;
revoke all on function public.get_my_session_status(uuid) from public;
grant execute on function public.get_my_session_status(uuid) to authenticated;

-- Restore the five-point feedback scale (was collapsed to three options).
alter type public.feedback_rating rename to feedback_rating_old;
create type public.feedback_rating as enum ('very_unhelpful', 'unhelpful', 'neutral', 'helpful', 'very_helpful');

alter table public.private_feedback
  alter column rating type public.feedback_rating using (
    case rating::text
      when 'not_useful' then 'very_unhelpful'
      when 'okay' then 'neutral'
      when 'useful' then 'very_helpful'
      else null
    end
  )::public.feedback_rating;

drop type public.feedback_rating_old;
