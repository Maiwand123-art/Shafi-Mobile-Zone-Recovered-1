# Recovery notes — Shafi Mobile Zone

This package restores the latest audited React/Vite source archive. It does not include `.env`, credentials, node_modules, or customer records.

## Restore
1. Install Node.js 20.19+ (or 22.12+).
2. Copy `.env.example` to `.env`.
3. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the existing Supabase project. Never use a service_role key in frontend code.
4. Run `npm install`, then `npm run dev`.
5. Run `npm run build` before deployment.

## Existing Supabase project
The included `supabase/schema.sql` is the earlier starter schema and does not include all later live tables/columns (loans, loan_payments, store_capital, extended sales fields, IMEI, etc.). **Do not run it over the existing live database.** Existing tables, policies, data and the profile-role trigger should be preserved.

The public Store page has explicit mobile columns and does not request IMEI. Admin pages retain admin-only full mobile details.

The earlier audit reported that the live Supabase project already had RLS enabled, an `is_admin()` helper, and a `protect_profile_role` trigger. Keep those live settings; do not disable RLS or expose service keys.
