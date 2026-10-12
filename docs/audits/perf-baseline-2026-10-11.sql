-- ============================================================================
-- Perf audit baseline — synthetic dataset + execution plans
-- Repo: bosun @ 433fb3e (feat/ux-7-leis), PostgreSQL 18 (pgvector/pgvector:0.8.7-pg18-trixie)
-- Companion report: docs/audits/perf-baseline-2026-10-11.md
--
-- Reproduce:
--   docker exec -i bosun-postgres-1 psql -U crm -d crm < docs/audits/perf-baseline-2026-10-11.sql
-- or paste each block into a psql session. Section A seeds data, section B runs
-- EXPLAIN (ANALYZE, BUFFERS) as crm_app (the least-privileged app role, subject
-- to RLS), section C cleans up. SELECT-only; no destructive statements besides
-- deleting the org this script itself created (idempotent re-run).
-- ============================================================================

-- ---------- A. Seed ----------------------------------------------------------
delete from organizations where id = '0f000000-0000-7000-8000-000000000001';
insert into organizations (id, name, slug, created_at)
values ('0f000000-0000-7000-8000-000000000001', 'PERF-AUDIT', 'perf-audit', now());

insert into channel_connections (id, organization_id, kind, name, status, credentials_encrypted, webhook_token)
values ('0f000000-0000-7000-8000-000000000002', '0f000000-0000-7000-8000-000000000001',
        'waha', 'perf-conn', 'connected', 'x', 'perf-token-0f000000');

insert into contacts (id, organization_id, channel_user_id, display_name)
select gen_random_uuid(), '0f000000-0000-7000-8000-000000000001',
       '5511' || lpad(g::text, 9, '0') || '@c.us', 'Contato ' || g
from generate_series(1, 200) g;

insert into conversations (id, organization_id, channel_connection_id, contact_id, external_id,
                           status, ticket_number, ticket_seq, last_message_at, created_at)
select gen_random_uuid(), '0f000000-0000-7000-8000-000000000001',
       '0f000000-0000-7000-8000-000000000002', c.id, c.channel_user_id,
       case when g <= 150 then 'open' when g <= 180 then 'resolved' else 'closed' end,
       g, 1,
       now() - (g || ' minutes')::interval,
       now() - ((g + 10000) || ' minutes')::interval
from (select row_number() over (order by id) as g, id, channel_user_id
      from contacts where organization_id = '0f000000-0000-7000-8000-000000000001') c;

insert into messages (organization_id, conversation_id, channel_connection_id, contact_id,
                      direction, content, external_id, status, sent_at)
select cv.organization_id, cv.id, cv.channel_connection_id, cv.contact_id,
       case when m % 3 = 0 then 'outbound' else 'inbound' end,
       jsonb_build_object('type','text','text','msg ' || m || ' on ticket ' || cv.ticket_number),
       'ext-' || cv.ticket_number || '-' || m, 'received',
       cv.created_at + (m || ' seconds')::interval
from conversations cv
cross join generate_series(1, 20) m
where cv.organization_id = '0f000000-0000-7000-8000-000000000001'
  and cv.ticket_number <= 150;

-- one "hot" conversation: 2,000 extra messages (ticket_number = 1)
insert into messages (organization_id, conversation_id, channel_connection_id, contact_id,
                      direction, content, external_id, status, sent_at)
select cv.organization_id, cv.id, cv.channel_connection_id, cv.contact_id,
       case when m % 2 = 0 then 'outbound' else 'inbound' end,
       jsonb_build_object('type','text','text','hot msg ' || m),
       'hot-' || m, 'received',
       cv.created_at + (m || ' seconds')::interval
from conversations cv
cross join generate_series(21, 2020) m
where cv.organization_id = '0f000000-0000-7000-8000-000000000001'
  and cv.ticket_number = 1;

update conversations set last_message_at = (select max(sent_at) from messages where conversation_id = conversations.id)
where organization_id = '0f000000-0000-7000-8000-000000000001';

vacuum analyze contacts;
vacuum analyze conversations;
vacuum analyze messages;

-- ---------- B. Measured plans (run as crm_app under tenant GUC) ---------------
set role crm_app;
select set_config('app.organization_id', '0f000000-0000-7000-8000-000000000001', false);

-- B1. Inbox queue view — packages/core/src/modules/messaging/reads.ts listConversations
explain (analyze, buffers)
select c.*, ct.display_name, ct.channel_user_id, u.name as assignee_name, t.name as sector_name,
  (select coalesce(m.content ->> 'text', m.content ->> 'caption', '[' || (m.content ->> 'type') || ']')
     from messages m where m.conversation_id = c.id
     order by m.sent_at desc nulls last, m.created_at desc limit 1) as last_message_preview,
  ((select m.direction from messages m where m.conversation_id = c.id
     order by m.sent_at desc nulls last, m.created_at desc limit 1) = 'inbound') as awaiting_reply
from conversations c
inner join contacts ct on ct.id = c.contact_id
left join users u on u.id = c.assignee_id
left join teams t on t.id = c.sector_id
where (c.status = 'open' and c.assignee_id is null and (c.snoozed_until is null or c.snoozed_until <= now()))
order by c.last_message_at asc nulls first
limit 50;

-- B2. Same subplans under the 'all' view (hot conversation is row #1)
explain (analyze, buffers)
select c.id,
  (select coalesce(m.content ->> 'text', m.content ->> 'caption', '[' || (m.content ->> 'type') || ']')
     from messages m where m.conversation_id = c.id
     order by m.sent_at desc nulls last, m.created_at desc limit 1) as last_message_preview,
  ((select m.direction from messages m where m.conversation_id = c.id
     order by m.sent_at desc nulls last, m.created_at desc limit 1) = 'inbound') as awaiting_reply
from conversations c
where (c.status not in ('resolved','closed') and (c.snoozed_until is null or c.snoozed_until <= now()))
order by c.last_message_at desc
limit 50;

-- B3. Contacts page — packages/core/src/modules/contacts/repository.ts listContacts
explain (analyze, buffers)
select c.id, c.channel_user_id, c.display_name, c.metadata, c.created_at,
  (select count(*)::int from conversations where conversations.contact_id = c.id) as conversation_count
from contacts c
where c.organization_id = '0f000000-0000-7000-8000-000000000001'
order by c.display_name asc, c.channel_user_id asc
limit 50 offset 0;

-- B4. latestResolvedTicket — runs per inbound message on a resolved chat
explain (analyze, buffers)
select id from conversations
where channel_connection_id = '0f000000-0000-7000-8000-000000000002'
  and external_id = '5511000000001@c.us'
  and status in ('resolved','closed')
order by created_at desc limit 1;

-- B5. findLatestConversationForChat — runs per widget history fetch/stream attach
explain (analyze, buffers)
select * from conversations
where channel_connection_id = '0f000000-0000-7000-8000-000000000002'
  and external_id = '5511000000001@c.us'
order by created_at desc limit 1;

-- ---------- C. Cleanup -------------------------------------------------------
reset role;
delete from organizations where id = '0f000000-0000-7000-8000-000000000001';
