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

## Practice Quiz and retired AI endpoint

Practice Quiz selects and shuffles course questions in the browser. Easy uses
up to two distinct answer choices, Medium uses up to four and can reverse the
translation direction, and Hard uses written answers. Adapt to me uses recent
correct and incorrect attempts per card. Results still save to Supabase as
`quiz` attempts. This activity does not call an AI provider and has no AI API
request quota or generation fee. Normal Supabase service limits still apply.

AI Quiz was removed on 5 November 2026. A real request to the former provider
returned `429 credit_balance_exhausted`, which the function translated to 502.
Adding paid credits did not meet the project's zero-cost requirement, so the
replacement uses the existing course bank. Question content can repeat.

The deployed `ai-practice-session` function is now a small retirement handler,
version 7. Its entrypoint and handler were compared with the prepared source;
JWT verification remains enabled. The handler returns `410 AI_QUIZ_RETIRED` for
POST, 204 for OPTIONS and 405 for other methods. It reads no server secrets,
reserves no sessions and makes no database or provider requests. The frontend
no longer invokes it, including when an old `activity=ai` lesson URL is opened.

Keep the earlier AI migrations intact as deployment history. The old profile
flag, session reservation function and any historical `ai_review` attempts are
not used for new quizzes. Historical attempts remain available in Progress as
Earlier practice. No account data or course progress needs to be deleted for
this update. The old OpenAI secrets are no longer used by the retired handler.

The replacement passed 39 automated tests and production browser checks with
intercepted Supabase responses. Real-account persistence and two-account access
checks still need recorded acceptance results. The frontend is prepared for
publication through the normal GitHub Pages workflow.

## New migrations

Use `npx supabase migration new describe_the_change` to create the next migration.
Review and test the SQL before applying it. Keep server secrets out of migrations,
source files and screenshots. Check the Security Advisor after schema changes,
and verify both policy conditions and cross-account behaviour.
