# Mukhlis Muhammad Jamiu — Arabic Voice Portfolio

Bilingual portfolio and private media studio for Arabic educator and voice artist Mukhlis Muhammad Jamiu. Built with Next.js, Supabase Auth, Postgres and private Supabase Storage.

## Features

- English and Arabic portfolio copy with RTL layout and a persistent language choice.
- Published audio/video library with expiring signed playback URLs.
- Private drafts protected by Supabase row-level security and a non-public media bucket.
- Password-protected administrator studio with allow-listed accounts.
- Resumable TUS uploads, retry/resume, progress reporting, cancellation and per-file size feedback.
- Printable, bilingual CV page. Visitors can choose “Print / save as PDF” and save it from their browser.
- Responsive navigation, keyboard focus styles and reduced-motion support.

## Local setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Create the owner and any editors in Supabase Auth, then add each user UUID to `public.portfolio_admins` using the example at the end of the SQL file.
3. Copy `.env.example` to `.env.local`, then set the Supabase project URL and publishable key. Never put the service-role key in a `NEXT_PUBLIC_` variable or browser code.
4. Run `npm install`, `npm run dev`, and open `http://localhost:3000`.
5. Add the same public environment variables in Vercel and deploy.

## Media privacy and limits

The `portfolio-media` bucket is private. Draft files are only readable by allow-listed administrators. Public signed playback is permitted only for media attached to a published work; links expire after one hour. Publishing a work makes its audio/video playable through those short-lived URLs.

Uploads use Supabase Storage's TUS resumable endpoint with 6 MiB chunks. The bucket limit is configured to 500 MiB per file, but the Supabase project's global upload limit and plan can impose a lower maximum. Increase the global limit in Supabase Storage settings only when the project's plan supports the desired size. Resumable transfers can continue after a network interruption when the same file is selected again in the same browser profile.

## Supabase setup notes

- Keep the project URL and publishable key in Vercel's Preview and Production environments.
- No service-role key is needed by this frontend. Admin authorization is checked server-side by Postgres RLS through `public.is_portfolio_admin()`.
- When migrating an already-public bucket, applying the SQL makes the bucket private. Previously shared public links may have been cached, so treat anything that was uploaded before this change as previously public.
- Authenticated email/password sign-in must be enabled for the approved studio users.
