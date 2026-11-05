# Supabase setup

`migrations/` records the database changes. Keep existing migration files intact
after they have been applied. Add a new migration for a later schema change.
The connected LinguaLoop project already contains the migrations and five
introductory courses. The quiz layout fix does not require SQL or a database reset.

## A separate development project

Install the locked dependencies with `npm ci` before using `npx supabase`.
The lockfile currently supplies CLI 2.110.0. Check `npx supabase --version` and the
relevant command's `--help` before running hosted changes. CLI v3 changes remote
targeting and confirmation rules, so these v2 instructions should not be copied
to a v3 setup without checking them.

For a new project, initialise the CLI configuration if it is absent, then sign in,
link the intended project and review the pending migrations:

```bash
npx supabase init
npx supabase login
npx supabase link
npx supabase db push --dry-run
```

Check the linked project before running `npx supabase db push`. Do not use a
production database for experiments. New schema work should be tested against
a separate development project first.

## Data and access rules

The migrations create profiles when accounts are registered, including while
confirmation is pending. This avoids asking an unsigned-in browser to insert a
profile through an authenticated policy. Curriculum is read-only for browser
clients. Profiles, progress and learning attempts use owner-based access rules.
Avatar writes are restricted to the learner's folder, with type and size limits.

Progress is upserted on `(user_id, concept_id)`. Repeating a card updates the
learner's existing progress row. Learning attempts are separate, append-only
records used for recent accuracy and Smart Review. Browser clients cannot edit
or delete attempt history.

The course expansion migration adds French, Mandarin Chinese and Arabic alongside
Spanish and Japanese. All five currently have one unit and 15 concepts. Each
concept needs both an English translation and a target-language translation.
Use a language's speech locale and enable microphone practice only for suitable
phrases. Japanese introductory characters are not a complete kana course.

RLS was enabled on all eight public tables checked on 5 November 2026. This is
configuration evidence. Test with two signed-in accounts to confirm that one
learner cannot read or change another learner's private records.

## AI Quiz function

The website invokes `ai-practice-session` with a unit ID and a level of `auto`,
`easy`, `medium` or `hard`. The function validates the signed-in user and AI opt-in,
loads course text and recent attempts, and reserves a session through
`reserve_ai_session`. The database limits each learner to ten reservations per
UTC day. Failed provider requests can still use a reserved session.

Only course text, anonymous attempt counts and temporary card references are
sent to the AI provider. Profile identity, database IDs, email, images, audio and
transcripts are excluded. The provider request uses `store: false`. A strict
schema and local validation check the returned references and question formats.
Correct answers and completion scoring come from course data, not the model.

`OPENAI_API_KEY` is an Edge Function secret. The optional `OPENAI_MODEL` secret
overrides the default `gpt-5.6-luna`. Keep these values in Supabase's server-side
secrets. The React application needs only its public Supabase configuration.

For a separate project, configure secrets in the Supabase dashboard, then deploy
only this function using the installed CLI after checking the linked target:

```bash
npx supabase functions deploy ai-practice-session
```

Keep JWT verification enabled. The handler also validates the user token. A
website publish does not perform this backend deployment.

## Deployment record and verification

On 5 November 2026, the connected function was replaced by version 5. Its entrypoint,
handler and shared validator matched the prepared source on retrieval. JWT
verification remained enabled. Live checks returned 200 for OPTIONS and 401 for
a POST without authentication. No real learner data or paid AI call was used
for those checks.

The updated response includes `contractVersion: 2`, the selected level and a
`format` for each item. The earlier version 4 response lacked that quiz contract.
The frontend now opens questions separately and shows generation failures
without silently substituting another quiz.

After publishing the frontend, sign in, enable AI Quiz in Settings and test each
level. Check that results save and that errors, retries and the explicit standard
quiz work. Provider key, model access and available credit are not proven by a
successful deployment. A real generated round remains an acceptance check.

## New migrations

Use `npx supabase migration new describe_the_change` to create the next migration.
Review and test the SQL before applying it. Keep server secrets out of migrations,
source files and screenshots. Check the Security Advisor after schema changes,
and verify both policy conditions and cross-account behaviour.
