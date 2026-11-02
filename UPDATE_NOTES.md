# October UI and practice update

Integrated 23 October 2026 against current GitHub `main`, commit
`b225fd4df5c965912081a3cd65f4eda258093141` in X-S-M-X/LinguaLoop.
The former K-Sinclair repository URL redirects to this repository.

## Included

- Original green palette, L logo, white cards, sidebar and dotted zigzag path.
- Shorter mobile Learn layout: compact heading and continue banner, closer path
  spacing, and a short goal/progress summary instead of stacked summary cards.
- Profile options beside the desktop sidebar or below the mobile avatar:
  change profile picture, open settings and log out. Keyboard, Escape and
  outside-click handling are included. Image validation/save code is shared
  with Settings.
- Learn, Practice, Courses, Progress and Settings navigation. Smart Review
  revisits course mistakes; AI Quiz offers fresh generated situations with
  easy, medium, hard and automatic difficulty. Core answers stay tied to
  course content. Failed AI requests offer a labelled standard quiz.
- Tidier Progress, updated activity cards, flashcard save handling and course
  switching. French, Mandarin Chinese and Modern Standard Arabic join Spanish
  and Japanese from the earlier catch-up work.
- Production uses the existing Supabase client and BrowserRouter. No example
  account, offline preview adapter or preview build controls are installed.
- The obsolete AiCoachActivity component is removed after its replacement.

## Installation

Use the supplied APPLY-OCTOBER-UPDATE.bat outside the project directory. It
checks affected file hashes against the current repository and the earlier
catch-up/review versions. Different local edits stop the update before copying.
It backs up affected files, creates a Git backup branch, applies the files,
runs npm ci and npm run check, and restores affected files if those checks fail.
It preserves .env, Git history, unrelated files and the existing Pages workflow.
Commit/push is offered after successful checks; only update paths are staged.

## Backend status

The existing Supabase project already has the five-course migration
20260922005810, 75 concepts, 150 translations and RLS on all eight public tables.
No SQL or auth configuration change is needed for this frontend update.

The matching AI Quiz function source is included. Deployment was blocked by
automatic approval review because production deployment needs explicit approval.
The live function remains version 4. Until the new function is deployed, a quiz
response without the new format fields falls back to the labelled standard quiz.

The new backend validates requested levels and response formats, keeps JWT and
user verification, opt-in, daily quota and controlled provider failures. It
supports older callers without a level parameter using compatible translation
questions. The SDK import is pinned to the existing lockfile version 2.110.8.

Signup still uses confirmation links. Email-code verification was discussed
but is not part of this update.

## Verification

- 43 Node tests pass, including the existing grading/progress/privacy tests,
  difficulty and output validation, endpoint authentication/consent/quota,
  legacy caller compatibility and invalid requested levels.
- Production build passes with placeholder Supabase configuration.
- Production Chromium checks use intercepted Supabase authentication, data,
  storage and quiz fixtures. They cover routes, desktop/mobile layouts,
  profile menus and photo saves, quiz levels, flashcards and logout.
- The Windows script is reviewed and its manifest, conflict and rollback rules
  are simulated against repository/catch-up fixtures. It has not been executed
  on a Windows machine here.

After installation, check the real signed-in account, photo upload, saved
progress, course switching and logout on desktop and phone. Live AI generation
still requires the matching backend deployment and a signed-in request. Device
voices and microphone recognition still need testing on the actual devices.
