# Shafi Mobile Zone

Premium mobile-store website starter built with React, Vite, Tailwind CSS v4 and Supabase.

## Included
- Responsive black / crimson Liquid Glass inspired storefront
- 40+ routed page paths (some informational/account/admin sections are starter shells)
- Supabase email/password signup, login and password recovery
- Customer account, profile, request history and saved/messages route foundations
- Mobile catalog, search/filter, mobile details and customer request submission
- Admin-only dashboard, mobile create/edit/deactivate, requests, messages and sales records
- Supabase PostgreSQL schema, Row Level Security and mobile image storage policies
- Vercel SPA rewrite configuration

## 1. Requirements
- Node.js 20.19+ or 22.12+
- npm
- A Supabase project

## 2. Install
```bash
npm install
```

## 3. Configure Supabase
1. Create a project at https://supabase.com.
2. Open **Project Settings → API**.
3. Copy the Project URL and the publishable key (or legacy anon key).
4. Copy `.env.example` to `.env`.
5. Fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

These are public client configuration values. The anon/publishable key is safe to use in a browser only because the database is protected by the included Row Level Security policies. Never put the `service_role` key in `.env` or frontend code.

## 4. Create database
Open **Supabase → SQL Editor**, paste all of `supabase/schema.sql`, and run it.

## 5. Create the first admin
1. Register your own account at `/signup`.
2. Confirm your email if email confirmation is enabled.
3. In Supabase SQL Editor, run this query with your signup email:
```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL_ADDRESS';
```
4. Sign out and sign in again. Your account will now show the Admin Dashboard.

Public signup always creates a `customer`. Admin role is never selectable in the signup form.

## 6. Run locally
```bash
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## 7. Build
```bash
npm run build
npm run preview
```

## 8. Deploy to Vercel
1. Push this folder to a private GitHub repository.
2. Import the repository into Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Project Settings → Environment Variables.
4. Deploy. `vercel.json` handles React Router refreshes.

## Important implementation notes
- The SQL schema is the security boundary. Do not disable RLS.
- The Admin dashboard is protected both in the UI and by database policies.
- This starter is not yet a finished commercial production release. The pages for compare, notifications, FAQ, contact form submission, ratings moderation, advanced analytics and message replies are scaffolds and need their full workflows implemented and tested.
- Before public launch, configure Supabase Auth email templates, allowed redirect URLs, backups, rate limits and privacy/terms text appropriate to your business.
- Do not upload customer data until the security policies and workflows have been reviewed.
