# AIM Method — Course Website

Dark, purple-neon course platform built with Next.js 14 and Tailwind CSS.

---

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Leave all settings as default (Vercel auto-detects Next.js).
4. Click **Deploy**. Your site will be live in ~60 seconds.
5. In Vercel → Settings → Domains, add `course.aimodelmethods.com` and follow the DNS instructions.

---

## Add Vturb Video Embeds to Lessons

Each lesson in `lib/courseData.ts` has an optional `videoEmbed` field. Paste the full Vturb `<script>` or `<iframe>` HTML there.

**Example:**

```ts
// lib/courseData.ts

{ id: 1, title: "START HERE", thumbnail: "/thumbnails/thumb-m1-l1.jpg",
  videoEmbed: `<div id="vid_abc123"></div><script src="https://scripts.converteai.net/..."></script>` },
```

The lesson page renders `videoEmbed` as raw HTML using `dangerouslySetInnerHTML`, so any embed code Vturb gives you will work as-is.

---

## Add or Change Student Accounts

Edit the `USERS` array in `lib/auth.ts`:

```ts
const USERS = [
  { email: "student@example.com", password: "mypassword", name: "John" },
];
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Test account: **test@aimmethod.com** / **test123**
