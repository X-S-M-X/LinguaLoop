# LinguaLoop

LinguaLoop is a React, Vite, and Supabase language-learning application built
as a 15-week university project. This repository currently contains the
foundation plus three learning activities: authentication, protected routes,
profiles, avatar storage, configurable flashcards, multiple-choice quizzes,
speaking practice, saved progress, database migrations, and GitHub Pages deployment.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```
5. Start the application:

   ```bash
   npm run dev
   ```

   Because the production project is hosted beneath `/LinguaLoop/`, Vite
   serves the local app at `http://localhost:5173/LinguaLoop/`.

## Database and authentication

The canonical database history is `supabase/migrations/`; do not maintain a
second hand-pasted schema file.

The migrations:

- enables Row Level Security on every table in the exposed `public` schema;
- gives browser clients read-only curriculum access;
- restricts profiles and progress to the signed-in owner;
- creates a profile from an `auth.users` trigger;
- preserves username metadata even while email confirmation is pending;
- limits avatar writes to each user's folder and restricts upload type/size.
- add learning-language, daily-goal, pronunciation, and speech preferences;
- seed 15-card Spanish greetings and Japanese foundations units;
- store a BCP 47 speech locale for each language;
- enforce stable unit/card ordering and safe progress upserts.

The Auth trigger is important: with confirmation enabled, Supabase returns a
new user without a session. The browser therefore cannot insert a profile
through an authenticated RLS policy. The trigger creates it inside the same
database transaction instead.

## Supabase URL configuration

In Supabase Dashboard → Authentication → URL Configuration, set:

- Site URL: `https://k-sinclair.github.io/LinguaLoop/`
- Additional redirect URL:
  `https://k-sinclair.github.io/LinguaLoop/dashboard`
- Local redirect URL:
  `http://localhost:5173/LinguaLoop/dashboard`

The confirmation email redirects to the dashboard. If the user has no valid
session, the protected route sends them to Login.

In Supabase Auth settings, keep **Confirm email** enabled and set the minimum
password length to at least 8 so the server matches the Signup form. The app's
client-side `minLength` improves feedback, but the hosted Auth rule is the real
enforcement boundary.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` tests, builds, and deploys every
push to `main`.

Create these GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Then open repository Settings → Pages and select **GitHub Actions** as the
publishing source.

The production artifact includes `404.html`. GitHub Pages serves that file for
direct SPA requests such as `/LinguaLoop/dashboard`; it returns the visitor to
the app base and restores the original route before React starts. This fixes
refreshes, copied protected-route links, and email-confirmation redirects.

## Checks

```bash
npm test
npm run build
```

`npm run check` runs both commands. The deployment workflow refuses to build
when either Supabase repository secret is missing.

## Browser speech support

Flashcards use the browser Web Speech synthesis API and do not need an external
API key. Speak and Repeat uses `SpeechRecognition` when the browser provides it,
with a listen-only fallback everywhere else. Chrome and Edge are the recommended
demonstration browsers for microphone matching.

Microphone access is requested only after the learner presses the button.
LinguaLoop does not upload or store microphone audio or recognised transcripts.
The browser or its speech provider may still process recognition.

### Dependency audit note

The project uses Vite 8 and React Router 7.18 to remove the older Vite
development-server and React Router navigation advisories. `npm audit` still
reports [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2),
which the advisory says applies only to React Router's unstable React Server
Components APIs. LinguaLoop is a browser-only declarative app and does not use
RSC or server actions. Recheck the audit when the patched router release is
available in the project's dependency line.

## Current scope

Built:

- Signup, email confirmation, login, and logout
- Authenticated users are redirected from public routes to their dashboard
- Responsive learning dashboard and learning path
- Profile, avatar, learning language, daily goal, pronunciation, and audio settings
- Fifteen-card Spanish and Japanese foundations units
- Japanese cards ordered as 10 useful phrases followed by 5 introductory hiragana
- Flashcard deck filters, 5/10/15-card rounds, direction swapping, TTS, and missed-card review
- Multiple-choice practice generated from each unit's existing translations
- Speak and Repeat practice with browser microphone matching and listen-only fallback
- Browser TTS shared by flashcards and speaking activities
- Per-card completion saved through RLS-protected progress rows
- Real card, unit, and course completion counts
- Dedicated responsive Progress page and navigation item
- Read-only curriculum data for browser clients
- Language-neutral lesson helpers shared by every activity

Planned:

- A third language after its first 15-card curriculum is reviewed
- Performance-history data for deterministic adaptive difficulty
- A bounded authenticated "Explain this card" action through a Supabase Edge Function
- AI-assisted question variations only after verified curriculum safeguards are in place
- Typed-answer and spaced-review practice
- Streaks and points after their rules and data model are designed
