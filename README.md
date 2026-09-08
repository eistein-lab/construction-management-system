# Construction Management System

Internal construction project-management system. See [CLAUDE.md](CLAUDE.md) for the full documentation index and non-negotiable business rules, and `/docs` for the complete specification.

## Stack

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · PostgreSQL + Prisma 7 (driver adapters) · Auth.js v5 (Credentials + JWT) · Vercel · GitHub.

## Getting Started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Seeded demo users: `<role>@demo.local` (e.g. `ceo@demo.local`), password from `SEED_USER_PASSWORD` in `.env`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (also type-checks)
- `npm run lint` — ESLint
- `npx prisma migrate dev` — apply schema migrations locally
- `npx prisma db seed` — seed demo users (one per role)
- `npx prisma studio` — browse the database

## Documentation

Everything else — data model, business rules, roles, the day-by-day implementation plan — lives in [`/docs`](docs) and is indexed from [CLAUDE.md](CLAUDE.md). Read the relevant doc before changing any business logic.
