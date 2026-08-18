-- Corgi Cafe — don't re-recommend anyone you were already introduced to today, not just declines.
--
-- 202608190004 added declined_within_a_day, which only suppressed a pair after an explicit decline
-- (recommendations.status = 'ended'). But being matched with someone at all today (you met them, or the
-- intro is still pending) and then being handed the same person again on your next search reads as
-- broken, especially in the two-person Demo pool where a re-seed gives each person a fresh session that
-- the session-level "already matched" filter no longer recognizes. Broaden the guard: suppress a re-match
-- for 24h after ANY recommendation between the pair, regardless of its status. A fresh day (the
-- recommendation is older than 24h) still allows a rematch, so the "rematch across days" behavior added
-- in 202608180001 is preserved. The function keeps its name so its two callers
-- (list_introduction_candidates, request_introduction) need no change; only the predicate widened.
create or replace function public.declined_within_a_day(member_a uuid, member_b uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.recommendations r
    join public.visit_intro_sessions rs on rs.id = r.requester_session_id
    join public.visit_intro_sessions cs on cs.id = r.counterpart_session_id
    where r.created_at >= now() - interval '24 hours'
      and ( (rs.member_id = member_a and cs.member_id = member_b)
         or (rs.member_id = member_b and cs.member_id = member_a) )
  );
$$;
