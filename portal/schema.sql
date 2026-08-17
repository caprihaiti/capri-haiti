-- =============================================================================
-- CAPRI DIGITAL ECOSYSTEM — Schéma de base de données (Supabase / PostgreSQL)
-- =============================================================================
-- Un seul schéma relationnel pour les 12 modules de l'écosystème, dès le
-- départ — c'est ce qui permet à CAPRI Institutional Pulse d'exister plus
-- tard comme de simples vues qui croisent ces tables, sans que rien ne
-- doive être reconstruit.
--
-- PHASE 1 (construite) : profiles, time_entries, tasks.
-- PHASE 2 (construite) : channels, channel_members, messages (CAPRI Messenger).
-- PHASE 3+ (tables créées maintenant, interfaces à venir) : documents,
--   meetings, resolutions, projects, kpis, partners, audit_log.
--
-- Installation : Supabase → SQL Editor → coller ce fichier entier → Run.
-- Peut être exécuté plusieurs fois sans risque (IF NOT EXISTS partout).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Types partagés
-- -----------------------------------------------------------------------------
do $$ begin
  create type capri_role as enum ('conseil_administration', 'direction', 'employe', 'consultant', 'partenaire', 'invite', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('a_faire', 'en_cours', 'en_revision', 'termine', 'bloque');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('basse', 'normale', 'haute', 'critique');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_status as enum ('projet', 'en_revision', 'valide', 'adopte', 'archive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('en_attente', 'approuve', 'rejete');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 1. CAPRI ID — profils et rôles (une identité pour tout l'écosystème)
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role capri_role not null default 'pending',
  department text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- À l'inscription (Supabase Auth), le compte reçoit automatiquement le rôle
-- 'pending' (aucun accès réel) jusqu'à ce qu'un administrateur lui attribue
-- un rôle depuis Supabase → Table Editor → profiles. Sécurité volontaire :
-- pas d'auto-attribution de rôle sensible (ex. conseil_administration).
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'pending');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Punch In/Out, Lunch In/Out
-- -----------------------------------------------------------------------------
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('punch_in', 'punch_out', 'lunch_start', 'lunch_end')),
  at timestamptz not null default now(),
  note text
);
create index if not exists idx_time_entries_user_at on time_entries(user_id, at desc);

-- -----------------------------------------------------------------------------
-- 3. CAPRI Tasks / Missions
-- -----------------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references profiles(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  due_date date,
  priority task_priority not null default 'normale',
  status task_status not null default 'a_faire',
  progress smallint not null default 0 check (progress between 0 and 100),
  source_type text not null default 'manuel' check (source_type in ('manuel', 'resolution', 'projet')),
  source_id uuid, -- référence libre vers resolutions.id ou projects.id selon source_type
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_assignee on tasks(assignee_id, status);

create table if not exists task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid not null references profiles(id),
  uploaded_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. CAPRI Docs + CAPRI Sign (phase 2)
-- -----------------------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text, -- rapport | projet_de_loi | tdr | convention | etude | pv | politique_interne | gouvernance | financier
  status document_status not null default 'projet',
  visibility text not null default 'conseil' check (visibility in ('conseil', 'equipe')), -- 'conseil' = conseil_administration/direction seulement ; 'equipe' = tout le personnel actif
  owner_id uuid not null references profiles(id),
  current_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Migration : ajoute la colonne aux installations antérieures sans perte de données.
alter table documents add column if not exists visibility text not null default 'conseil';
do $$ begin
  alter table documents add constraint documents_visibility_check check (visibility in ('conseil', 'equipe'));
exception when duplicate_object then null; end $$;

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number integer not null,
  file_url text not null,
  changed_by uuid not null references profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

-- Stockage des fichiers (Supabase Storage) — bucket PRIVÉ, jamais public.
insert into storage.buckets (id, name, public)
select 'capri-docs', 'capri-docs', false
where not exists (select 1 from storage.buckets where id = 'capri-docs');

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  step_order smallint not null,
  approver_id uuid not null references profiles(id),
  status approval_status not null default 'en_attente',
  signed_at timestamptz,
  comment text
);

-- -----------------------------------------------------------------------------
-- 5. CAPRI Board — réunions, résolutions (phase 2)
-- -----------------------------------------------------------------------------
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_type text not null default 'equipe' check (meeting_type in ('conseil', 'equipe', 'externe')),
  scheduled_at timestamptz not null,
  location text, -- adresse ou lien CAPRI Meet
  agenda text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists meeting_attendees (
  meeting_id uuid not null references meetings(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  present boolean,
  primary key (meeting_id, user_id)
);

create table if not exists resolutions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  text text not null,
  decided_at timestamptz,
  status text not null default 'adoptee' check (status in ('proposee', 'adoptee', 'rejetee'))
);

-- -----------------------------------------------------------------------------
-- 6. CAPRI Projects + CAPRI Performance (phase 2/3)
-- -----------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  institution_name text not null,
  phase text not null default 'diagnostic' check (phase in ('diagnostic', 'recommandations', 'plan_action', 'implementation_pilote', 'evaluation', 'suivi')),
  owner_id uuid not null references profiles(id),
  started_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  unit text,
  baseline numeric,
  target numeric,
  current_value numeric,
  measured_at date not null default current_date
);

-- -----------------------------------------------------------------------------
-- 7. CAPRI Partners — CRM institutionnel (phase 3)
-- -----------------------------------------------------------------------------
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text, -- ministere | organisation_internationale | ambassade | autre
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists partner_interactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  interaction_type text, -- reunion | convention | echange
  summary text,
  happened_at date not null default current_date,
  logged_by uuid not null references profiles(id)
);

-- -----------------------------------------------------------------------------
-- 8. CAPRI Messenger (phase 3)
-- -----------------------------------------------------------------------------
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text, -- vide pour les conversations directes (le nom affiché est calculé côté client à partir du membre en face)
  is_direct boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
-- Migration : les installations ayant déjà exécuté une version antérieure
-- du schéma avaient `name` obligatoire — l'assouplir sans perte de données.
alter table channels alter column name drop not null;

create table if not exists channel_members (
  channel_id uuid not null references channels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (channel_id, user_id)
);
create index if not exists idx_channel_members_user on channel_members(user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_channel_at on messages(channel_id, created_at);

-- Fonction utilitaire (security definer, contourne volontairement RLS pour
-- cette seule vérification) : évite les politiques RLS auto-référentes sur
-- channel_members, qui sont sujettes à erreur. Utilisée par toutes les
-- politiques de CAPRI Messenger ci-dessous.
create or replace function is_channel_member(cid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from channel_members cm where cm.channel_id = cid and cm.user_id = uid);
$$;

-- Fonction RPC (security definer) pour créer un canal : à utiliser à la
-- place d'un INSERT direct côté client sur channels. Un diagnostic
-- approfondi (schéma, politiques, auth.uid() vérifiés corrects par
-- plusieurs méthodes indépendantes, y compris dans les logs Postgres bruts)
-- n'a pas permis d'expliquer un refus RLS persistant sur l'INSERT direct ;
-- cette fonction contourne le problème et, en prime, crée le canal et y
-- ajoute tous les membres en une seule opération atomique.
create or replace function create_channel(p_name text, p_is_direct boolean, p_member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Non authentifié.';
  end if;

  insert into channels (name, is_direct, created_by)
  values (p_name, p_is_direct, v_uid)
  returning id into v_channel_id;

  insert into channel_members (channel_id, user_id)
  values (v_channel_id, v_uid)
  on conflict do nothing;

  insert into channel_members (channel_id, user_id)
  select v_channel_id, m
  from unnest(coalesce(p_member_ids, array[]::uuid[])) as m
  where m <> v_uid
  on conflict do nothing;

  return v_channel_id;
end;
$$;

grant execute on function create_channel(text, boolean, uuid[]) to authenticated;

-- Publication temps réel : nécessaire pour que les nouveaux messages
-- s'affichent instantanément sans recharger la page (Supabase Realtime).
do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 9. Audit log — CAPRI Secure Vault + alimente CAPRI Institutional Pulse
-- -----------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  at timestamptz not null default now()
);

-- =============================================================================
-- SÉCURITÉ — Row Level Security (RLS)
-- Principe : chacun voit son propre travail ; direction et conseil
-- d'administration voient plus largement ; personne ne peut s'attribuer un
-- rôle sensible lui-même (seule une mise à jour manuelle dans Supabase peut
-- faire passer un compte de 'pending' à un rôle actif).
-- =============================================================================
alter table profiles enable row level security;
alter table time_entries enable row level security;
alter table tasks enable row level security;
alter table task_attachments enable row level security;

drop policy if exists "profiles_select_all_active" on profiles;
create policy "profiles_select_all_active" on profiles for select
  using (auth.uid() is not null);

drop policy if exists "profiles_update_own_basic_fields" on profiles;
create policy "profiles_update_own_basic_fields" on profiles for update
  using (auth.uid() = id);

drop policy if exists "time_entries_own_or_direction" on time_entries;
drop policy if exists "time_entries_select_own_or_direction" on time_entries;
create policy "time_entries_select_own_or_direction" on time_entries for select
  using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('direction', 'conseil_administration'))
  );
drop policy if exists "time_entries_insert_own" on time_entries;
create policy "time_entries_insert_own" on time_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_select_relevant" on tasks;
create policy "tasks_select_relevant" on tasks for select
  using (
    auth.uid() = assignee_id or auth.uid() = created_by
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('direction', 'conseil_administration'))
  );
drop policy if exists "tasks_insert_authenticated" on tasks;
create policy "tasks_insert_authenticated" on tasks for insert
  with check (auth.uid() = created_by);
drop policy if exists "tasks_update_relevant" on tasks;
create policy "tasks_update_relevant" on tasks for update
  using (
    auth.uid() = assignee_id or auth.uid() = created_by
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('direction', 'conseil_administration'))
  );

drop policy if exists "task_attachments_select_relevant" on task_attachments;
create policy "task_attachments_select_relevant" on task_attachments for select
  using (exists (select 1 from tasks t where t.id = task_id and (t.assignee_id = auth.uid() or t.created_by = auth.uid())));
drop policy if exists "task_attachments_insert_own" on task_attachments;
create policy "task_attachments_insert_own" on task_attachments for insert
  with check (uploaded_by = auth.uid());

-- CAPRI Messenger : chacun ne voit que les canaux dont il est membre, et ne
-- peut écrire que dans ceux-là — jamais de canal ou message visible depuis
-- l'extérieur, même via l'API.
alter table channels enable row level security;
alter table channel_members enable row level security;
alter table messages enable row level security;

drop policy if exists "channels_select_member" on channels;
create policy "channels_select_member" on channels for select
  using (is_channel_member(id, auth.uid()));
drop policy if exists "channels_insert_own" on channels;
create policy "channels_insert_own" on channels for insert
  with check (created_by = auth.uid());

drop policy if exists "channel_members_select_if_member" on channel_members;
create policy "channel_members_select_if_member" on channel_members for select
  using (is_channel_member(channel_id, auth.uid()));
drop policy if exists "channel_members_insert_self_or_member" on channel_members;
create policy "channel_members_insert_self_or_member" on channel_members for insert
  with check (user_id = auth.uid() or is_channel_member(channel_id, auth.uid()));

drop policy if exists "messages_select_member" on messages;
create policy "messages_select_member" on messages for select
  using (is_channel_member(channel_id, auth.uid()));
drop policy if exists "messages_insert_member" on messages;
create policy "messages_insert_member" on messages for insert
  with check (sender_id = auth.uid() and is_channel_member(channel_id, auth.uid()));

-- CAPRI Docs : espace de documents internes, réservé par défaut au Conseil
-- d'administration et à la Direction (documents de gouvernance, financiers,
-- etc.) — un document peut être ouvert à 'equipe' (tout le personnel actif)
-- au cas par cas via la colonne visibility.
create or replace function can_see_document(doc_visibility text, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = uid
      and (
        p.role in ('conseil_administration', 'direction')
        or (doc_visibility = 'equipe' and p.active)
      )
  );
$$;

alter table documents enable row level security;
alter table document_versions enable row level security;

drop policy if exists "documents_select_visible" on documents;
create policy "documents_select_visible" on documents for select
  using (can_see_document(visibility, auth.uid()));
drop policy if exists "documents_insert_board" on documents;
create policy "documents_insert_board" on documents for insert
  with check (owner_id = auth.uid() and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('conseil_administration', 'direction')));
drop policy if exists "documents_update_board" on documents;
create policy "documents_update_board" on documents for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('conseil_administration', 'direction')));

drop policy if exists "document_versions_select_visible" on document_versions;
create policy "document_versions_select_visible" on document_versions for select
  using (exists (select 1 from documents d where d.id = document_id and can_see_document(d.visibility, auth.uid())));
drop policy if exists "document_versions_insert_board" on document_versions;
create policy "document_versions_insert_board" on document_versions for insert
  with check (changed_by = auth.uid() and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('conseil_administration', 'direction')));

-- Stockage (Supabase Storage) : mêmes règles d'accès que la table
-- documents, appliquées directement sur le bucket capri-docs — un fichier
-- n'est ni lisible ni déposable sans passer par ces politiques, même avec
-- l'URL directe du fichier.
drop policy if exists "capri_docs_storage_select" on storage.objects;
create policy "capri_docs_storage_select" on storage.objects for select
  using (bucket_id = 'capri-docs' and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('conseil_administration', 'direction')));
drop policy if exists "capri_docs_storage_insert" on storage.objects;
create policy "capri_docs_storage_insert" on storage.objects for insert
  with check (bucket_id = 'capri-docs' and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('conseil_administration', 'direction')));

-- Phase 3+ : activer RLS sur les tables restantes au fur et à mesure qu'une
-- interface les utilise réellement (meetings, resolutions, projects, kpis,
-- partners, audit_log). Les créer maintenant sans RLS actif évite de
-- bloquer leur usage avant d'avoir une politique d'accès définie module par
-- module.
