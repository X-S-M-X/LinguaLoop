-- LinguaLoop Week 6: speech preferences, speech-ready language metadata,
-- and five additional concepts for each current learning language.

begin;

alter table public.languages
  add column if not exists speech_locale text;

alter table public.concepts
  add column if not exists speech_practice_enabled boolean not null default false;

alter table public.profiles
  add column if not exists autoplay_tts boolean not null default false;

alter table public.profiles
  add column if not exists speech_rate numeric(3, 2) not null default 1.00;

update public.languages
set speech_locale = case code
  when 'en' then 'en-US'
  when 'es' then 'es-ES'
  when 'ja' then 'ja-JP'
  else speech_locale
end
where code in ('en', 'es', 'ja');

-- Turn the existing Japanese unit into a balanced foundations deck. Keep the
-- first five hiragana concept IDs so existing progress remains accurate.
update public.units
set slug = 'japanese-foundations',
    title = 'Japanese foundations',
    description = 'Start with ten practical phrases, then meet the first five hiragana.',
    sort_order = 0
where slug in ('hiragana-foundations', 'japanese-foundations')
  and language_id = (select id from public.languages where code = 'ja');

update public.concepts
set sort_order = case slug
      when 'ja-hiragana-a' then 10
      when 'ja-hiragana-i' then 11
      when 'ja-hiragana-u' then 12
      when 'ja-hiragana-e' then 13
      when 'ja-hiragana-o' then 14
    end,
    speech_practice_enabled = false
where slug in (
  'ja-hiragana-a',
  'ja-hiragana-i',
  'ja-hiragana-u',
  'ja-hiragana-e',
  'ja-hiragana-o'
);

-- The later five kana have no saved progress. Reuse their stable records for
-- practical phrases instead of deleting rows or changing completed content.
update public.concepts
set slug = case slug
      when 'ja-hiragana-ka' then 'ja-basics-excuse-me'
      when 'ja-hiragana-ki' then 'ja-basics-yes'
      when 'ja-hiragana-ku' then 'ja-basics-no'
      when 'ja-hiragana-ke' then 'ja-basics-please'
      when 'ja-hiragana-ko' then 'ja-basics-nice-to-meet-you'
    end,
    speech_practice_enabled = true
where slug in (
  'ja-hiragana-ka',
  'ja-hiragana-ki',
  'ja-hiragana-ku',
  'ja-hiragana-ke',
  'ja-hiragana-ko'
);

with replacement(concept_slug, english_term, japanese_term, romanization) as (
  values
    ('ja-basics-excuse-me', 'Excuse me', 'すみません', 'sumimasen'),
    ('ja-basics-yes', 'Yes', 'はい', 'hai'),
    ('ja-basics-no', 'No', 'いいえ', 'iie'),
    ('ja-basics-please', 'Please', 'お願いします', 'onegaishimasu'),
    ('ja-basics-nice-to-meet-you', 'Nice to meet you', 'はじめまして', 'hajimemashite')
)
update public.translations as translations
set term = case languages.code
      when 'en' then replacement.english_term
      when 'ja' then replacement.japanese_term
    end,
    romanization = case languages.code
      when 'ja' then replacement.romanization
      else null
    end
from public.concepts as concepts,
     public.languages as languages,
     replacement
where translations.concept_id = concepts.id
  and translations.language_id = languages.id
  and concepts.slug = replacement.concept_slug
  and languages.code in ('en', 'ja');

update public.concepts as concepts
set speech_practice_enabled = true
from public.units as units,
     public.languages as languages
where concepts.unit_id = units.id
  and units.language_id = languages.id
  and languages.code = 'es';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'languages_speech_locale_format'
      and conrelid = 'public.languages'::regclass
  ) then
    alter table public.languages
      add constraint languages_speech_locale_format
      check (
        speech_locale is null
        or (
          char_length(speech_locale) between 2 and 35
          and speech_locale ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_speech_rate_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_speech_rate_allowed
      check (speech_rate in (0.75, 1.00, 1.25)) not valid;
  end if;
end
$$;

with concept_seed(
  language_code,
  unit_slug,
  slug,
  difficulty,
  sort_order,
  speech_practice_enabled
) as (
  values
    ('es', 'spanish-greetings', 'es-greetings-nice-to-meet-you', 2, 10, true),
    ('es', 'spanish-greetings', 'es-greetings-your-name', 2, 11, true),
    ('es', 'spanish-greetings', 'es-greetings-my-name', 2, 12, true),
    ('es', 'spanish-greetings', 'es-greetings-see-you-later', 2, 13, true),
    ('es', 'spanish-greetings', 'es-greetings-excuse-me', 2, 14, true),
    ('ja', 'japanese-foundations', 'ja-basics-hello', 1, 0, true),
    ('ja', 'japanese-foundations', 'ja-basics-good-morning', 1, 1, true),
    ('ja', 'japanese-foundations', 'ja-basics-good-evening', 1, 2, true),
    ('ja', 'japanese-foundations', 'ja-basics-thank-you', 1, 3, true),
    ('ja', 'japanese-foundations', 'ja-basics-goodbye', 1, 4, true)
)
insert into public.concepts (
  id,
  slug,
  unit_id,
  difficulty,
  sort_order,
  speech_practice_enabled
)
select
  gen_random_uuid(),
  concept_seed.slug,
  units.id,
  concept_seed.difficulty,
  concept_seed.sort_order,
  concept_seed.speech_practice_enabled
from concept_seed
join public.languages on languages.code = concept_seed.language_code
join public.units
  on units.language_id = languages.id
 and units.slug = concept_seed.unit_slug
on conflict (slug) do update set
  unit_id = excluded.unit_id,
  difficulty = excluded.difficulty,
  sort_order = excluded.sort_order,
  speech_practice_enabled = excluded.speech_practice_enabled;

with translation_seed(concept_slug, language_code, term, romanization) as (
  values
    ('es-greetings-nice-to-meet-you', 'en', 'Nice to meet you', null),
    ('es-greetings-nice-to-meet-you', 'es', 'Mucho gusto', null),
    ('es-greetings-your-name', 'en', 'What is your name?', null),
    ('es-greetings-your-name', 'es', '¿Cómo te llamas?', null),
    ('es-greetings-my-name', 'en', 'My name is...', null),
    ('es-greetings-my-name', 'es', 'Me llamo...', null),
    ('es-greetings-see-you-later', 'en', 'See you later', null),
    ('es-greetings-see-you-later', 'es', 'Hasta luego', null),
    ('es-greetings-excuse-me', 'en', 'Excuse me', null),
    ('es-greetings-excuse-me', 'es', 'Perdón', null),
    ('ja-basics-hello', 'en', 'Hello', null),
    ('ja-basics-hello', 'ja', 'こんにちは', 'konnichiwa'),
    ('ja-basics-good-morning', 'en', 'Good morning', null),
    ('ja-basics-good-morning', 'ja', 'おはようございます', 'ohayō gozaimasu'),
    ('ja-basics-good-evening', 'en', 'Good evening', null),
    ('ja-basics-good-evening', 'ja', 'こんばんは', 'konbanwa'),
    ('ja-basics-thank-you', 'en', 'Thank you', null),
    ('ja-basics-thank-you', 'ja', 'ありがとうございます', 'arigatō gozaimasu'),
    ('ja-basics-goodbye', 'en', 'Goodbye', null),
    ('ja-basics-goodbye', 'ja', 'さようなら', 'sayōnara')
)
insert into public.translations (
  id,
  concept_id,
  language_id,
  term,
  romanization
)
select
  gen_random_uuid(),
  concepts.id,
  languages.id,
  translation_seed.term,
  translation_seed.romanization
from translation_seed
join public.concepts on concepts.slug = translation_seed.concept_slug
join public.languages on languages.code = translation_seed.language_code
on conflict (concept_id, language_id, term) do update set
  romanization = excluded.romanization;

alter table public.languages validate constraint languages_speech_locale_format;
alter table public.profiles validate constraint profiles_speech_rate_allowed;

-- These are existing RLS-enabled tables. Repeat their least-privilege grants
-- so a fresh migration replay has the same Data API access as production.
revoke all on public.languages, public.units, public.concepts, public.translations
  from anon, authenticated;
grant select on public.languages, public.units, public.concepts, public.translations
  to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

commit;
