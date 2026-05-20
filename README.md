# EnglishPro TOEIC Learning Platform

EnglishPro is a full-stack TOEIC learning platform built around role-based workflows for students, parents, teachers, and administrators. The system focuses on vocabulary by topic, TOEIC grammar, TOEIC exam guidance, ETS-style mock tests, learning audit trails, gamified learning, and content governance.

## Highlights

- Role dashboards for Student, Parent, Teacher, and Admin.
- Student workflow: learn TOEIC vocabulary by topic, study grammar, understand TOEIC parts, take ETS-style mock tests, view progress, and use the learning playground.
- Parent workflow: audit child learning activity, review quiz/mock-test results, receive support suggestions, and manage learning notifications.
- Teacher workflow: manage TOEIC vocabulary topics, grammar topics, practice-test content, and student learning audit/corrections.
- Admin workflow: manage accounts and permissions, moderate TOEIC content, monitor learning data, and manage system configuration/logs.
- ETS mock-test experience: choose test, choose parts, auto timer, answer sheet, submit, score, review correct/wrong/skipped questions, and inspect explanations.
- Listening and Reading assets are split from PDF into UI-ready question/group images instead of forcing learners to read the whole PDF.
- Zoo-themed learning experience with pets, ambient effects, speech/audio interactions, mini games, and AI Vision hooks.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, CSS.
- Backend: NestJS 11, TypeScript, JWT auth.
- Database: PostgreSQL, Prisma.
- Local services: Docker Compose, Redis-ready setup.
- AI and integrations: TensorFlow MobileNet in browser, optional OpenAI Vision, Datamuse, Free Dictionary, LanguageTool, Tatoeba, Openverse, Wikipedia/Wikimedia.
- TOEIC tooling: Swift/PDFKit scripts for extracting ETS PDF content into web assets.

## Project Structure

```text
apps/web                 Next.js frontend
apps/api                 NestJS backend
packages/database        Prisma schema and database helpers
packages/shared          Shared roles, constants, and types
docs                     Analysis and supporting documents
scripts                  Dev helpers and ETS asset extraction scripts
apps/web/public/ets      Generated TOEIC image assets used by the UI
ETS                      Local source PDFs/audio/keys, kept out of Git
```

## Main Routes

```text
/login                   Login
/dashboard               Role dashboard

/lessons                 Student vocabulary topic library
/lessons/[id]/learn      Vocabulary learning screen
/lessons/[id]/game       Topic game review
/grammar                 TOEIC grammar topics
/grammar/[id]            Grammar topic detail and practice
/toeic-guide             TOEIC test introduction and tips
/ets-practice            Mock-test selector
/ets-practice/take       Mock-test room
/ets-practice/result     Mock-test result and explanations
/playground              Learning playground, pets, mini game, AI Vision
/progress                Student progress

/parent/audit            Child learning audit trail
/parent/results          Child learning and mock-test results
/parent/support          Alerts and review suggestions
/parent/notifications    Parent reminders and interactions

/students                Teacher student management
/toeic-practice          Teacher practice-test management

/admin/users             Account and permission management
/admin/content           TOEIC content moderation
/admin/progress          Learning data monitoring
/admin                   System configuration, integrations, and logs
```

## Admin Use Cases

1. Account and permission management: create, edit, lock/unlock, delete users, and assign actor roles.
2. TOEIC content moderation: review learning paths, topics, lessons, quizzes, and practice-test readiness before publishing.
3. Learning data monitoring: inspect student progress, quiz/mock-test signals, audit logs, alerts, and create reminders.
4. System configuration and logs: review API/system health, integration status, operational logs, and admin checkpoints.

## TOEIC Mock Test Flow

1. Open `/ets-practice`.
2. Choose TOEIC Listening & Reading.
3. Choose an ETS test.
4. Tick one or more parts.
5. Start the test; the timer runs automatically.
6. Answer directly in the UI.
7. Submit manually or let the system auto-submit when time is over.
8. Review score, accuracy, correct/wrong/skipped answers, and explanations in `/ets-practice/result`.

Current asset coverage:

- Part 1: individual image per question.
- Part 2: audio-first question-response UI.
- Part 3: conversation groups with grouped questions.
- Part 4: talk groups with grouped questions.
- Part 5: individual and grouped reading-question images.
- Part 6: passage group images.
- Part 7: reading passage group images.

## Local ETS Assets

Keep the original ETS source files locally at the project root:

```text
ETS/
  ETS 2026- LC.pdf
  ETS 2026- RC.pdf
  TRANSCRIPT.pdf
  AUDIO/
  KEY READING/
  KEY VÀ GIẢI THÍCH CHI TIẾT/
```

Do not commit `ETS/` because it can be large and may contain licensed material. Generated UI assets live in `apps/web/public/ets`.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Docker Desktop if using Docker Compose
- macOS with Swift/PDFKit if regenerating ETS PDF assets

## Installation

```bash
npm install
cp .env.example .env
npm run db:generate
```

## Environment Variables

Minimum local setup:

```bash
DATABASE_URL=
JWT_SECRET=
API_PORT=4100
NEXT_PUBLIC_API_URL=http://127.0.0.1:4100/api
```

Optional integrations:

```bash
MERRIAM_WEBSTER_LEARNERS_KEY=
PIXABAY_API_KEY=
PEXELS_API_KEY=
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4.1-mini
```

## Run Locally

Run web and API together:

```bash
npm run dev
```

Run separately:

```bash
npm run dev:web
npm run dev:api
```

Default local URLs:

```text
Web: http://localhost:4000
API: http://localhost:4100/api
```

The dev script frees ports 4000 and 4100 before starting. If needed, inspect ports manually:

```bash
lsof -Pan -iTCP:4000 -sTCP:LISTEN
lsof -Pan -iTCP:4100 -sTCP:LISTEN
```

## Docker

```bash
npm run docker:up
npm run docker:down
```

## Database

Generate Prisma client:

```bash
npm run db:generate
```

Seed SQL data:

```bash
npm run db:seed:sql
```

Useful SQL files:

```text
thiet_ke_csdl_hoc_tieng_anh.sql
du_lieu_mo_rong_hoc_tieng_anh.sql
cap_nhat_quiz_tieng_viet_co_dau.sql
cap_nhat_anh_minh_hoa_daily_routine.sql
```

## Demo Accounts

```text
admin@englishpro.local      / 123456
giaovien@englishpro.local   / 123456
phuhuynh@englishpro.local   / 123456
hocvien1@englishpro.local   / 123456
hocvien2@englishpro.local   / 123456
```

## Useful Scripts

```bash
npm run dev
npm run dev:web
npm run dev:api
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:studio
npm run docker:up
npm run docker:down
```

ETS asset scripts:

```bash
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-answer-keys.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part5-assets.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part5-group-assets.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part6-group-assets.swift
CLANG_MODULE_CACHE_PATH=/private/tmp/clang-module-cache swift scripts/generate-ets-part7-group-assets.swift
```

## Verification

Before committing:

```bash
npm run build -w apps/web
npm run build -w apps/api
git diff --check
```

## Git Notes

- Do not commit `.env`, `.env.local`, `node_modules`, `.next`, database volumes, or the raw `ETS/` folder.
- Commit generated public ETS assets only when they are required by the UI.
- Dashboard pages should remain role hubs; each business use case should live on its own route.
