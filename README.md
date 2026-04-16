This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Contact Form SMTP Setup

The contact form posts to `app/api/contact/route.ts` and sends an email using SMTP (Nodemailer).

1. Copy `.env.example` to `.env.local`.
2. Fill SMTP values in `.env.local`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
CONTACT_TO_EMAIL=vardaanbuildersandcontractors@gmail.com
```

Notes:
- For Gmail SMTP, use an App Password (not your normal account password).
- If you use port `465`, set `SMTP_SECURE=true`.

The form includes these fields:
- Name
- Email
- Contact Us (phone/WhatsApp)
- Project Type
- Project Details

## Architectural Marvels Backend (MongoDB)

Marvel cards now load from MongoDB in batches of 5 from `app/api/marvels/route.ts`.

- Initial load: 5 cards
- Infinite load: fetches next batch when user scrolls near end
- Fallback: if API fails, homepage shows built-in fallback projects

### Required env vars

```bash
MONGODB_URI=your-mongodb-uri
MONGODB_DB_NAME=vardaan
```

### Admin page to add Marvels

Open:

```bash
/admin/marvels
```

This page is access-controlled and requires a valid admin token before you can use it.

After access is granted:
- Upload an image file directly in the form.
- The image is converted to base64 automatically in the browser.
- The base64 string is stored in MongoDB as `img`.

Optional protection:

```bash
ADMIN_TOKEN=replace-with-strong-secret
NEXT_PUBLIC_ADMIN_TOKEN=replace-with-strong-secret
```

If `ADMIN_TOKEN` is set, admin requests must include the same token.
Both `ADMIN_TOKEN` and `NEXT_PUBLIC_ADMIN_TOKEN` are validated for admin access/session.

## Install dependencies

If dependencies are missing, run:

```bash
npm install mongodb nodemailer
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
