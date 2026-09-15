# SignaturePrintsPH — Job Tracker (hosted version)

This is the standalone, hosted version of your job tracker. Unlike the version that
runs inside Claude, this one works from any browser, on any device, without opening
Claude at all — powered by a free [Supabase](https://supabase.com) database for the
shared, live-updating board, and hosted for free on [Vercel](https://vercel.com).

Everything below is meant to be followed in order. It should take about 20–30 minutes
the first time.

---

## 1. Create your Supabase project (the database)

1. Go to [supabase.com](https://supabase.com) and sign up (free — no card required).
2. Click **New project**. Pick any name (e.g. `signatureprintsph`), set a database
   password (save it somewhere), and choose the region closest to the Philippines
   (e.g. Singapore).
3. Wait ~2 minutes for the project to finish setting up.

## 2. Set up the database tables

1. In your new project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/schema.sql` from this project, copy its entire contents, and paste
   it into the SQL editor.
4. Click **Run**. You should see "Success. No rows returned."

This creates all your tables (jobs, customers, suppliers, materials, job files),
turns on live sync, and creates a public storage folder for uploaded files (PDFs,
images, 3D models).

## 3. Get your API keys

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`).
3. Copy the **anon public** key (a long string starting with `eyJ...`).
   You'll need both in step 5.

> This "anon" key is meant to be public — it's what your website uses to talk to the
> database. Access is controlled by the rules we set up in `schema.sql`, not by hiding
> this key.

## 4. Push this project to GitHub

1. Create a new (private is fine) repository on [github.com](https://github.com).
2. Upload all the files in this project folder to that repository (drag-and-drop
   works fine on GitHub's web UI, or use `git push` if you're comfortable with git).

## 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up using your GitHub account.
2. Click **Add New → Project**, and select the repository you just created.
3. Vercel will auto-detect it's a Vite project. Before clicking Deploy, expand
   **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → paste your Project URL from step 3
   - `VITE_SUPABASE_ANON_KEY` → paste your anon public key from step 3
4. Click **Deploy**. After a minute or two, you'll get a live URL like
   `signatureprintsph.vercel.app` — that's the link you share with your team.

That's it — anyone who opens that link sees the same live, shared job board,
same as it worked inside Claude, but now from any browser or device, no Claude
account needed.

---

## What's included

- **Board** — the same stage-by-stage job pipeline (Quote → Prepress → Printing →
  Finishing → Ready → Delivered)
- **Dashboard** — jobs due this week, overdue, rush jobs, jobs awaiting client
  approval, revenue collected/outstanding, low-stock materials
- **Invoicing** — priced jobs with one-click payment status and auto-numbered
  invoices
- **Customers** and **Suppliers** — contact directories
- **Materials** — stock levels with reorder alerts
- **Client approval** — mark each job Pending / Approved / Changes requested
- **File attachments** — attach PDFs, JPG/PNG images, or 3D model files (STL, OBJ,
  GLB, GLTF, FBX) to any job, right from the "New job" form or from a job's detail
  view. Files are stored in Supabase Storage and are visible to everyone with the
  link.
- **Live sync** — powered by Supabase Realtime; changes appear for everyone
  instantly, no page refresh needed (this is a real upgrade over the polling-based
  sync used inside Claude).

## Costs

At this scale (a small team's internal tool), this should run **entirely on free
tiers**:
- Vercel free tier: 100GB bandwidth/month — far more than you'll use.
- Supabase free tier: 500MB database + 1GB file storage + 50,000 monthly active
  users — plenty of room for years of job records and attached files.
- The one thing to know: a free Supabase project pauses after 7 days with zero
  activity. Regular use keeps it awake; if it ever pauses, one visit to your
  Supabase dashboard wakes it back up in under a minute.

If your business grows a lot, Vercel Pro is ~$20/month and Supabase Pro is
~$25/month — but that's only relevant at real scale, not for day-to-day use.

## Security note

There's no login on this app — anyone with the link can view and edit everything,
same as the version inside Claude. That's fine for an internal team tool shared over
a private link. If you ever want to add a simple password gate or per-person logins,
that's a follow-up project we can add on top of this.

## Local development (optional)

If you want to run this on your own computer before deploying:

```
npm install
cp .env.example .env
# edit .env and paste in your Supabase URL + anon key
npm run dev
```

Then open the local address it prints (usually `http://localhost:5173`).

## Updating the site later

Any time you want to change something (colors, fields, features), the easiest path
is to come back to this Claude conversation and ask — I'll update the project files,
you re-upload the changed files to GitHub, and Vercel automatically redeploys within
about a minute.
