This is a [Next.js](https://nextjs.org) project enhanced with a multi-view internship recommendation demo (PM Internship Scheme style) built on top of the default create-next-app starter.

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

### Application Views
`app/page.js` contains a single-page state machine with these views:
* welcome – marketing / hero, eligibility, impact, CTA
* login – email/password mock auth or continue as guest
* form – candidate profile collection (`CandidateProfileForm`)
* results – recommendation grid (`RecommendationResults`)
* internship-details – detail page for a selected internship
* profile-settings – placeholder profile settings
* submitted-applications – list & withdraw functionality

State is managed locally with React hooks; no backend yet.

### Key Components (under `app/components`)
* `Navbar` – top navigation with notification badge
* `RecommendationEngine` – placeholder recommendation generator
* `InternshipCard` + `RecommendationResults` – list & card UIs
* `CandidateProfileForm` – simple form collecting profile data
* `InternshipDetails` – details & apply action
* `ProfileSettings` – placeholder save flow
* `SuccessModal` – modal for success states
* `SubmittedApplications` – shows applied internships
* UI primitives in `components/ui` (`button`, `card`)

### Toasts
The project uses `sonner` (`<Toaster />` added in `layout.js`) for success/info toasts.

### Development
Edit any component or logic in `app/components` and the page will auto-refresh.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy
Standard Next.js deployment (e.g. Vercel) works. Build first:
```
npm run build && npm start
```
