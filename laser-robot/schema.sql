-- =============================================================================
-- LASER-ROBOT — Schéma de base de données (Supabase / PostgreSQL)
-- =============================================================================
-- Plateforme documentaire d'évaluation présidentielle, appliquant la même
-- charte nationale (22 domaines / 78 critères) à chaque candidat, sans
-- biais, sans score global, sans classement, sans recommandation de vote.
--
-- Projet Supabase INDÉPENDANT de celui du portail interne CAPRI
-- (portal/schema.sql) : aucune table partagée, aucune donnée commune — les
-- informations sur les candidats ne doivent jamais se trouver dans la même
-- base que les données internes du personnel CAPRI.
--
-- Installation : Supabase → SQL Editor → coller ce fichier entier → Run.
-- Peut être exécuté plusieurs fois sans risque (IF NOT EXISTS partout).
-- Puis exécuter seed_domains_criteria.sql (les 22 domaines et 78 critères).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Types partagés
-- -----------------------------------------------------------------------------
do $$ begin
  create type laser_role as enum ('pending', 'lecteur', 'reviewer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assessment_status as enum ('À documenter', 'À examiner', 'Documenté', 'Vérifié', 'Allégation grave documentée', 'Non applicable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type evidence_status as enum ('Non vérifié', 'À examiner', 'Vérifié', 'Contesté', 'Non vérifiable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type evidence_type as enum (
    'Document officiel / source primaire', 'Programme ou engagement public', 'Déclaration du candidat',
    'Fait documenté', 'Allégation attribuée', 'Sanction administrative', 'Enquête en cours',
    'Recommandation de poursuite', 'Décision judiciaire définitive'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 1. LASER ID — profils et rôles
-- -----------------------------------------------------------------------------
-- Un compte nouvellement créé reçoit automatiquement le rôle 'lecteur' —
-- accès gratuit, immédiat et en lecture seule à toutes les fiches (c'est
-- l'accès public de LASER-ROBOT : n'importe quel citoyen peut chercher un
-- candidat par son nom et consulter ce qui a été documenté). Aucune écriture
-- n'est possible avec ce rôle (voir les politiques RLS plus bas). Les rôles
-- 'reviewer' et 'admin', qui donnent un droit d'écriture, restent attribués
-- uniquement à la main par un administrateur depuis Supabase → Table Editor
-- → profiles — jamais auto-attribuables. 'pending' reste disponible comme
-- état manuel (un administrateur peut y remettre un compte pour suspendre
-- son accès sans le désactiver complètement).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role laser_role not null default 'lecteur',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'lecteur');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Garde-fou : ni le rôle ni l'état actif d'un compte ne peuvent être changés
-- par son propre titulaire, même via une requête directe à l'API — seul un
-- administrateur (vérifié en base, pas seulement caché dans l'interface) le
-- peut. Sans ce déclencheur, la politique RLS « chacun modifie son propre
-- profil » permettrait à quiconque de s'auto-promouvoir administrateur.
-- auth.uid() est null en dehors de PostgREST (SQL Editor, service_role) —
-- contexte déjà pleinement privilégié (c'est là que l'admin approuve un
-- compte, cf. README), donc non concerné par ce garde-fou.
create or replace function guard_profiles_role_update()
returns trigger as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active) and auth.uid() is not null then
    if not exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Seul un administrateur peut modifier le rôle ou l''état actif d''un compte.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_role_guard on profiles;
create trigger profiles_role_guard
  before update on profiles
  for each row execute function guard_profiles_role_update();

-- Fonction utilitaire (security definer, contourne volontairement RLS pour
-- cette seule vérification, même principe que is_channel_member côté
-- portail) : évite une politique RLS auto-référente sur profiles, source
-- classique de récursion infinie.
create or replace function has_role(uid uuid, roles laser_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles p where p.id = uid and p.active and p.role = any(roles));
$$;

-- -----------------------------------------------------------------------------
-- 2. Charte nationale — domaines et critères (référentiel, lecture seule
--    depuis l'application ; peuplé par seed_domains_criteria.sql)
-- -----------------------------------------------------------------------------
create table if not exists domains (
  id text primary key,
  name text not null
);

create table if not exists criteria (
  id text primary key,
  domain_id text not null references domains(id),
  title text not null,
  requirement text not null,
  indicators text,
  evidence_expected text,
  safeguard text
);
create index if not exists idx_criteria_domain on criteria(domain_id);

-- -----------------------------------------------------------------------------
-- 3. Candidats
-- -----------------------------------------------------------------------------
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  political_group text,
  cep_status text not null default 'Non vérifié',
  birth_date date,
  birthplace text,
  nationality text,
  biography text,
  photo_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidates_photo_url_scheme check (photo_url is null or photo_url ~ '^https?://')
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_candidates_updated_at on candidates;
create trigger trg_candidates_updated_at
  before update on candidates
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Évaluations — un état par candidat × critère (78 par candidat)
-- -----------------------------------------------------------------------------
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  criterion_id text not null references criteria(id),
  status assessment_status not null default 'À documenter',
  score smallint check (score is null or score between 0 and 5),
  analysis text,
  reviewer_id uuid references profiles(id),
  reviewed_at timestamptz,
  unique (candidate_id, criterion_id)
);
create index if not exists idx_assessments_candidate on assessments(candidate_id);

-- À la création d'un candidat, les 78 critères sont initialisés
-- automatiquement, identiques pour tous, sans traitement de faveur.
create or replace function seed_candidate_assessments()
returns trigger as $$
begin
  insert into assessments (candidate_id, criterion_id)
  select new.id, c.id from criteria c
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_seed_assessments on candidates;
create trigger trg_seed_assessments
  after insert on candidates
  for each row execute function seed_candidate_assessments();

-- Horodatage et identité du réviseur posés par le serveur, jamais par le
-- client : empêche qu'un navigateur falsifie « qui a évalué » un critère.
create or replace function stamp_assessment_review()
returns trigger as $$
begin
  if (new.status is distinct from old.status or new.score is distinct from old.score or new.analysis is distinct from old.analysis) then
    new.reviewer_id := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_stamp_assessment on assessments;
create trigger trg_stamp_assessment
  before update on assessments
  for each row execute function stamp_assessment_review();

-- -----------------------------------------------------------------------------
-- 5. Éléments documentaires (preuves)
-- -----------------------------------------------------------------------------
create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  criterion_id text references criteria(id),
  title text not null,
  evidence_type evidence_type not null,
  source_name text,
  source_url text,
  publication_date date,
  summary text,
  verification_status evidence_status not null default 'Non vérifié',
  candidate_response text,
  reviewer_notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint evidence_source_url_scheme check (source_url is null or source_url ~ '^https?://')
);
create index if not exists idx_evidence_candidate on evidence(candidate_id);

-- -----------------------------------------------------------------------------
-- 6. Journal d'audit
-- -----------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  username text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details text,
  at timestamptz not null default now()
);

create or replace function log_audit()
returns trigger as $$
declare
  v_username text;
  v_details text;
  v_row jsonb := to_jsonb(new);
begin
  select full_name into v_username from profiles where id = auth.uid();
  -- to_jsonb(new) ->> 'col' plutôt que new.col : évite une erreur « champ
  -- inexistant » puisque cette même fonction sert de déclencheur à trois
  -- tables qui n'ont pas les mêmes colonnes (candidates/assessments/evidence).
  v_details := case TG_TABLE_NAME
    when 'assessments' then 'critère ' || (v_row ->> 'criterion_id') || ' → ' || (v_row ->> 'status')
    when 'evidence' then v_row ->> 'title'
    when 'candidates' then v_row ->> 'full_name'
    else null
  end;
  insert into audit_log(actor_id, username, action, entity_type, entity_id, details)
  values (auth.uid(), coalesce(v_username, 'système'), lower(TG_OP), TG_TABLE_NAME, new.id::text, v_details);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_candidates on candidates;
create trigger trg_audit_candidates after insert or update on candidates for each row execute function log_audit();
drop trigger if exists trg_audit_assessments on assessments;
create trigger trg_audit_assessments after insert or update on assessments for each row execute function log_audit();
drop trigger if exists trg_audit_evidence on evidence;
create trigger trg_audit_evidence after insert or update on evidence for each row execute function log_audit();

-- =============================================================================
-- SÉCURITÉ — Row Level Security (RLS)
-- Principe : 'pending' ne voit ni ne modifie rien. 'lecteur' lit tout, écrit
-- rien (futur accès lecture, site non public pour l'instant — l'accès reste
-- derrière une connexion). 'reviewer' et 'admin' lisent et écrivent les
-- dossiers. Seul 'admin' gère les comptes. Aucune suppression n'est permise
-- depuis le client (pas de politique DELETE) — conservation intégrale.
-- =============================================================================
alter table profiles enable row level security;
alter table domains enable row level security;
alter table criteria enable row level security;
alter table candidates enable row level security;
alter table assessments enable row level security;
alter table evidence enable row level security;
alter table audit_log enable row level security;

drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select
  using (auth.uid() = id or has_role(auth.uid(), array['admin']::laser_role[]));

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles for update
  using (auth.uid() = id or has_role(auth.uid(), array['admin']::laser_role[]));
-- (role/active restent protégés par le déclencheur profiles_role_guard
-- ci-dessus, même pour un admin modifiant son propre compte.)

drop policy if exists "domains_select_approved" on domains;
create policy "domains_select_approved" on domains for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));

drop policy if exists "criteria_select_approved" on criteria;
create policy "criteria_select_approved" on criteria for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));

drop policy if exists "candidates_select_approved" on candidates;
create policy "candidates_select_approved" on candidates for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));
drop policy if exists "candidates_insert_reviewer" on candidates;
create policy "candidates_insert_reviewer" on candidates for insert
  with check (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));
drop policy if exists "candidates_update_reviewer" on candidates;
create policy "candidates_update_reviewer" on candidates for update
  using (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));

drop policy if exists "assessments_select_approved" on assessments;
create policy "assessments_select_approved" on assessments for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));
drop policy if exists "assessments_insert_reviewer" on assessments;
create policy "assessments_insert_reviewer" on assessments for insert
  with check (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));
drop policy if exists "assessments_update_reviewer" on assessments;
create policy "assessments_update_reviewer" on assessments for update
  using (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));

drop policy if exists "evidence_select_approved" on evidence;
create policy "evidence_select_approved" on evidence for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));
drop policy if exists "evidence_insert_reviewer" on evidence;
create policy "evidence_insert_reviewer" on evidence for insert
  with check (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));
drop policy if exists "evidence_update_reviewer" on evidence;
create policy "evidence_update_reviewer" on evidence for update
  using (has_role(auth.uid(), array['admin','reviewer']::laser_role[]));

drop policy if exists "audit_log_select_approved" on audit_log;
create policy "audit_log_select_approved" on audit_log for select
  using (has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[]));
-- Seule une consultation du scanner (lecture) peut être journalisée
-- directement par le client — toute autre action est déjà journalisée par
-- les déclencheurs ci-dessus, côté serveur, sans intervention du client.
drop policy if exists "audit_log_insert_self_consultation" on audit_log;
create policy "audit_log_insert_self_consultation" on audit_log for insert
  with check (
    actor_id = auth.uid() and action = 'consultation'
    and has_role(auth.uid(), array['admin','reviewer','lecteur']::laser_role[])
  );
