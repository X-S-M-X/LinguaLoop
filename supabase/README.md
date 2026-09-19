# Supabase migrations

`migrations/` is the source of truth for the LinguaLoop database. Apply each
migration once and commit it with the application change that depends on it.

## First-time setup

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

`supabase init` creates the local CLI configuration without replacing the
tracked migration directory. The dry run shows which migrations are pending
before anything is changed remotely.

The project reference is the subdomain in
`https://YOUR_PROJECT_REF.supabase.co`. Do not put a database password or
service-role key in the React application.

## Existing project database

The first migration upgrades the existing scaffold as well as creating a new
database. It:

- enables RLS on every table exposed through the public API;
- makes curriculum tables read-only to browser clients;
- creates profiles from an `auth.users` trigger, including while email
  confirmation is pending;
- adds database-level username, score, and uniqueness protection;
- restricts avatar uploads by owner, MIME type, and size.

Run `npx supabase db push`, then use the Supabase Security Advisor to confirm
that no exposed table is missing RLS.

The Week 3 migration adds learning preferences and the first two flashcard
units. It uses explicit browser-role grants as well as RLS, so the curriculum
is readable while profiles and progress remain owner-only. Apply migrations
before deploying React code that expects the new profile columns.

The Week 5 flashcard and quiz update reuses the existing `progress` table and
does not add a migration. Both activity types upsert on the existing unique
`(user_id, concept_id)` index. A correct quiz answer or a "Got it" flashcard
therefore completes a concept once, while repeated practice safely updates the
same owner-protected row.

The Week 6 migration expands both current courses from 10 to 15 cards, adds
language speech locales, adds saved TTS preferences, and marks which concepts
are suitable for microphone phrase matching. It keeps the existing Japanese
`あ` concept ID, so already-saved progress remains attached to the same card.
The migration does not create a new public table or weaken any RLS policy.

The Week 8 migration adds append-only learning attempts. Signed-in users can
read and insert only their own attempts. Browser clients cannot update or
delete attempt history. Smart Review uses this evidence without an external
service.

The Week 9 migration adds the opt-in AI coaching preference and a small AI
session audit table. Browser clients cannot insert session reservations
directly. The authenticated `reserve_ai_session` database function atomically
enforces a maximum of ten AI plans per user per UTC day.

## AI practice Edge Function

The React app never receives the OpenAI key. For the connected LinguaLoop
project, the authenticated function was deployed with JWT verification on
26 August 2026. Add the key only in Supabase Edge Function secrets. If this
source is installed into a different Supabase project, deploy it there with:

```bash
npx supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
npx supabase functions deploy ai-practice-session
```

The default model is `gpt-5.6-luna`. To change it without editing source, add
an optional `OPENAI_MODEL` Edge Function secret. ChatGPT subscriptions and API
billing are separate, so the OpenAI API account must have billing enabled.

The function sends only reviewed card text, anonymous correct and incorrect
counts, and a temporary request-only card number. It does not send database
IDs, timestamps, unit metadata, profile names, usernames, email addresses,
avatars, microphone audio, or transcripts. It uses strict structured output,
maps every returned card number back to reviewed curriculum locally, and
leaves completion scoring in the existing deterministic code. If the key or
service is unavailable, the client offers the local Smart Review fallback
instead of pretending AI was used.

For another learning language, add a `languages` row with a BCP 47
`speech_locale`, then add its unit, concepts, English translations, and target
translations in a new migration. Set `concepts.speech_practice_enabled` only
for complete words or phrases that are suitable for browser recognition.

## Adding another migration

```bash
npx supabase migration new describe_the_change
```

Edit the generated SQL file, test it against a development project, and apply
it with `npx supabase db push`. Avoid editing an already-applied migration;
create a new one so the database history remains reproducible.
