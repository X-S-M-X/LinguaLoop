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
- Practice Quiz with Easy, Medium, Hard and Adapt to me. Five course questions
  are shuffled in the browser, with written recall for harder cards. Questions
  open separately from setup and are checked against course answers.
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

The values belong in your local `.env`, not in source files. A Supabase
service-role key must never be placed in a `VITE_` variable. Practice Quiz does
not need an external AI API or provider key.

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
| `supabase/functions` | Retired AI endpoint for older clients |

## Checks

```bash
npm run check
```

This runs the Node test suite and a production build. The Practice Quiz update
passed 39 tests on 5 November 2026. Tests for the removed AI generator were
removed with that code; the retained suite checks course quizzes, answer marking,
progress helpers and the retired endpoint.

Production browser checks at 320, 375, 768 and 1440px used intercepted Supabase
responses. All four difficulty modes completed with saved attempts in the test
fixture. Checks also covered save retries, old links, refresh recovery and Arabic
written input. No AI requests were made. These checks do not replace live account,
real-device speech or cross-account access tests.

## Deploy the website

The workflow in `.github/workflows/deploy.yml` tests, builds and publishes pushes
to `main`. Set Pages to use GitHub Actions and provide these repository secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Vite uses `/LinguaLoop/` as its base. `public/404.html` restores application
routes when a learner opens or refreshes a direct lesson link.

The frontend replacement is prepared from main commit `c5ab8a8`; publishing it
still requires the normal commit and push. The PowerShell updater synchronises
main before applying these changes and checks file hashes before writing.

On 5 November 2026, the old `ai-practice-session` function was replaced by a
retired handler (version 7), with JWT verification enabled. It makes no database
or provider requests and returns `410 AI_QUIZ_RETIRED` to old POST callers. It is
kept only so older clients cannot continue generating provider requests. The new
frontend does not invoke it. Old `activity=ai` lesson links redirect to Practice
Quiz. Existing migrations and historical attempts are retained.

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
Practice Quiz reuses the course bank. Question selection and choices are
shuffled, so repeats are possible. It creates no new phrases or AI situations.

## AI assistance

AI tools helped with interface ideas, including the zigzag path, parts of the
implementation, debugging, tests and documentation. Live AI quiz generation was
removed after the provider rejected requests because its credit balance was
exhausted. The final quiz direction avoids AI API costs and quotas. I remain
responsible for reviewing the work, understanding the code and explaining its
limitations.
