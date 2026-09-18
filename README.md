# PlusMinus — Supabase indexing build

This build replaces the browser-only `localStorage` site list with Supabase.

## 1. Create the database
In Supabase SQL Editor, paste and run **supabase.sql**.

The table is `public.sites`. RLS allows:
- public users: read approved records only
- signed-in admins: read/insert/update/delete records

The browser uses the Supabase **publishable** key. Supabase documents that publishable keys are intended for browser apps when RLS is enabled; secret/service-role keys must remain server-side.

## 2. Create the admin account
In Supabase Dashboard → Authentication → Users, create the email/password user you want to use for the PlusMinus Admin Console.

Then open `/admin.html` and sign in with that account.

## 3. Deploy
Upload these project files to GitHub and let Vercel deploy them. The `/api/fetch-meta.js` serverless route is used to read article metadata without depending on browser CORS.

## What this version does
- Add an article URL from Admin.
- Server fetches the article's title and description.
- Keywords are automatically extracted from title + description.
- New records start as `pending`.
- Approve, Disapprove (with reason), and Re-review update Supabase.
- Public All-search reads only approved records.
- Search relevance is calculated from title, description, keywords, domain and phrase matches.
- `admin_priority` is already included in the ranking calculation for future manual ranking controls.

## Important
Do not add a Supabase secret/service-role key to the frontend or GitHub.
