-- Log de checagens compartilhado entre as mesas do Tepequém Up 2026.
-- Nunca sobe dado pessoal do atleta (CPF, telefone, e-mail, nome) — só o
-- número de peito, o resultado da checagem, o operador (funcionário) e horários.
-- Tabela insert-only por construção: sem policy de update/delete para "anon".

create table public.checkin_events (
  event_id         uuid primary key,
  numero_inscricao text not null,
  status           text not null check (status in ('valido', 'invalido', 'pendente')),
  motivo           text,
  observacao       text,
  operador         text not null,
  device_id        uuid not null,
  device_label     text,
  checked_at       timestamptz not null,
  received_at      timestamptz not null default now(),
  event_code       text not null default 'TEPEQUEM2026'
);

create index idx_checkin_events_numero on public.checkin_events (numero_inscricao, checked_at desc);
create index idx_checkin_events_code on public.checkin_events (event_code);

alter table public.checkin_events enable row level security;

create policy "anon insere checkin_events"
  on public.checkin_events
  for insert
  to anon
  with check (event_code = 'TEPEQUEM2026');

create policy "anon le checkin_events"
  on public.checkin_events
  for select
  to anon
  using (event_code = 'TEPEQUEM2026');

-- Habilita Realtime (visão ao vivo combinada no Painel):
-- alter publication supabase_realtime add table public.checkin_events;
-- (ou: Dashboard → Database → Replication → marcar checkin_events)
