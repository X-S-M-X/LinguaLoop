# LinguaLoop

LinguaLoop is my language learning application for COMP.6208 Project 1. It uses
React and Vite for the website, with Supabase for accounts, course data and saved
progress. The design keeps a green theme and a zigzag learning path.

- [Application](https://x-s-m-x.github.io/LinguaLoop/)
- [Repository](https://github.com/X-S-M-X/LinguaLoop)

## Features

- Accounts, email confirmation, login and logout.
- Profile pictures, course selection, daily goals and audio preferences.
- Spanish, Japanese, French, Mandarin Chinese and Arabic introductory courses.
  Each currently has one unit with 15 concepts.
- Flashcards with deck filters, missed-card review and browser text-to-speech.
- Multiple-choice quizzes, written recall and saved learning attempts.
- Smart Review, which selects cards using mistakes and unfinished concepts.
- Optional AI Quiz with Easy, Medium, Hard and an adaptive setting. Questions
  open separately from setup, and answers are checked against course content.
- Speak and Repeat using browser speech recognition where supported.
- Learn, Practice, Courses, Progress and Settings screens, with mobile navigation
  and a profile menu.

## Run locally

Use Node.js 22.12 or newer in the Node 22 line, as used by the deployment workflow.

```bash
npm ci
```

Copy `.env.example` to `.env` and add the project URL and public browser key:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The values belong in your local `.env`, not in source files. An OpenAI key or a
Supabase service-role key must never be placed in a `VITE_` variable.

```bash
npm run dev
```

Open `http://localhost:5173/LinguaLoop/`. A separate Supabase setup is described
in [supabase/README.md](supabase/README.md). The connected project already has
the course migrations, so do not rebuild or reset its database for a UI update.

## Project structure

| Folder | Contents |
| --- | --- |
| `src/pages` | Main application screens |
| `src/components/learning` | Flashcards, quizzes and speaking activities |
| `src/hooks` | Lesson data, overview data and browser speech |
| `src/context` | Account and profile state |
| `src/lib` | Activity helpers and their tests |
| `src/styles` | Shared layout and activity styles |
| `supabase/migrations` | Database schema, access rules and course seeds |
| `supabase/functions` | AI quiz handler and shared validation |

## Checks

```bash
npm run check
```

This runs the Node test suite and a production build. The quiz fix was checked
on 5 November 2026 with 44 passing tests. Browser checks at 320, 375, 768 and
1440px used intercepted Supabase responses. They cover layout and request flow,
but do not prove live AI generation, real-device speech or cross-account access.

## Deploy the website

The workflow in `.github/workflows/deploy.yml` tests, builds and publishes pushes
to `main`. Set Pages to use GitHub Actions and provide these repository secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Vite uses `/LinguaLoop/` as its base. `public/404.html` restores application
routes when a learner opens or refreshes a direct lesson link.

Website deployment does not deploy the Supabase Edge Function. The connected
`ai-practice-session` function was updated to version 5 on 5 November 2026,
with JWT verification enabled. Its deployed source was compared with this fix.
An OPTIONS request returned 200 and an unauthenticated POST returned 401. A
signed-in generated round still needs to be checked after publishing the frontend.

## Account confirmation and speech

The application keeps email-link confirmation. It does not add email-code
verification or two-factor authentication. For the current deployment, Supabase
Auth should use `https://x-s-m-x.github.io/LinguaLoop/` as the Site URL and allow
`https://x-s-m-x.github.io/LinguaLoop/dashboard` as a redirect. Local development
also needs `http://localhost:5173/LinguaLoop/dashboard` in the allowed redirects.

Browser text-to-speech uses the device's available voices. Speak and Repeat
compares a recognised transcript with course text; it does not score pronunciation.
The app requests microphone access after a button press and does not upload or
store audio or transcripts itself. The browser's speech provider may process them.

## Remaining work

The original Spanish and Japanese targets require a second unit each. Real-account
progress persistence, two-account access isolation, phone speech support and the
planned voluntary user evaluation still need recorded acceptance results.
AI questions can vary, but a new request is not a guarantee that every question
will be unique. A generation error offers a standard quiz as an explicit choice.

## AI assistance

AI tools helped with interface ideas, including the zigzag path, parts of the
implementation, debugging, tests and documentation. The AI Quiz also uses an AI
service inside the application. These are separate uses of AI. I am responsible
for reviewing the work, understanding the code and explaining its limitations.
