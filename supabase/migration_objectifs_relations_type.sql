-- Ajoute un type à objectifs_relations : 'sert_a' (directionnel, la
-- source sert à atteindre la cible — comportement historique) ou
-- 'complementaire' (symétrique : deux objectifs qui se renforcent
-- mutuellement, sans qu'un ordre de progression soit imposé entre eux).
alter table objectifs_relations
  add column if not exists type text not null default 'sert_a' check (type in ('sert_a', 'complementaire'));
