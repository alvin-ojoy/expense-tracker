# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Expense-tracking SaaS application built with Next.js 15.4.6, Shadcn/ui, and Supabase.

## Architecture
- **Frontend**: Next.js 15.4.6 App Router with React Server Components
- **Styling**: Tailwind CSS v4 + Shadcn/ui component library
- **Backend**: Supabase (Postgres + Auth + Real-time subscriptions)
- **Deployment**: Vercel edge runtime
- **Database**: PostgreSQL with Row Level Security (RLS)

## Core Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database & Supabase
```bash
npx supabase login   # Login to Supabase CLI
npx supabase init    # Initialize Supabase locally
npx supabase start   # Start local Supabase
npx supabase db reset # Reset local database
```

### Testing
```bash
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Key Files & Structure

### Database Schema
- `/supabase/migrations/` - Database migrations
- `/supabase/config.toml` - Supabase configuration
- Primary table: `expenses` with columns:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `amount` (numeric)
  - `category` (text)
  - `description` (text)
  - `date` (date)
  - `created_at` (timestamp)

### App Structure
```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, signup)
│   ├── (dashboard)/      # Protected routes
│   │   ├── expenses/     # Expense management
│   │   └── summary/      # Monthly summaries
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Shadcn/ui components
│   └── custom/           # Custom components
├── lib/
│   ├── supabase/         # Supabase client & queries
│   └── utils/            # Utility functions
└── middleware.js         # Auth middleware
```

### Authentication Flow
- Middleware at `/middleware.js` protects dashboard routes
- Supabase Auth with email/password + Google OAuth
- Session management via cookies

### Component Patterns
- Use server components by default
- Client components only when needed (forms, interactive elements)
- Shadcn/ui components for consistent styling
- Dark mode support via `next-themes`

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Deployment
- Push to main branch auto-deploys to Vercel
- Environment variables configured in Vercel dashboard
- Database migrations run automatically on deploy

## Common Tasks

### Adding New Expense
1. Use `ExpenseForm` component with validation
2. Insert via Supabase client
3. Real-time updates via Supabase subscriptions

### Monthly Summary
1. Query expenses for current month
2. Calculate totals by category
3. Display using Recharts for charts
4. CSV export via `/api/export-csv`

### Authentication Setup
1. Configure Supabase Auth providers
2. Set up RLS policies for expenses table
3. Add middleware route protection