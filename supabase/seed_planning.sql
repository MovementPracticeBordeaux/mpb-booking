-- Semaine de référence : le lundi 17 août 2026 est une semaine B
insert into semaine_reference (id, date_lundi_reference, semaine_ce_lundi)
values (1, '2026-08-17', 'B')
on conflict (id) do update set
  date_lundi_reference = excluded.date_lundi_reference,
  semaine_ce_lundi = excluded.semaine_ce_lundi;

-- Semaine A
insert into cours (discipline, semaine, jour_semaine, heure_debut, heure_fin) values
  ('Calisthenics', 'A', 2, '12:15', '13:15'),
  ('Handstand',    'A', 2, '19:30', '20:30'),
  ('Mobilité',     'A', 3, '11:00', '12:00'),
  ('Arm Balance',  'A', 3, '12:15', '13:15'),
  ('Handstand',    'A', 4, '12:15', '13:15'),
  ('Calisthenics', 'A', 5, '11:00', '12:00'),
  ('Locomotion',   'A', 5, '12:15', '13:15');

-- Semaine B
insert into cours (discipline, semaine, jour_semaine, heure_debut, heure_fin) values
  ('Altinha',      'B', 1, '11:00', '12:00'),
  ('Locomotion',   'B', 1, '12:15', '13:15'),
  ('Calisthenics', 'B', 2, '12:15', '13:15'),
  ('Handstand',    'B', 2, '19:30', '20:30'),
  ('Locomotion',   'B', 3, '12:15', '13:15'),
  ('Mobilité',     'B', 4, '11:00', '12:00'),
  ('Handstand',    'B', 4, '12:15', '13:15');
