# Day 11 - CleanGo Rebrand and French UI

## Completed

- Installed the official CleanGo logo from the provided image.
- Replaced the header and footer logo assets with the official CleanGo logo.
- Generated derived CleanGo brand assets:
  - `public/Images/brand/cleango-official.png`
  - `public/Images/brand/cleango-app-icon.png`
  - `public/Images/brand/cleango-app-icon-blue.png`
  - `public/Images/brand/cleango-hero-card.png`
  - `public/Images/brand/cleango-og.png`
  - `src/app/icon.png`
- Updated app metadata to French-first CleanGo copy.
- Updated footer defaults to CleanGo Cameroon contact and mission copy.
- Updated customer, admin, and collector login branding.
- Updated customer login demo credentials to the Firebase demo customer.
- Converted the launch home page to CleanGo-ready sections only:
  - Hero
  - Plans/services
  - About
  - FAQ
- Replaced the public About page with a CleanGo waste-collection page.
- Replaced the legacy services and stores pages with redirects to `/subscription-plans`.
- Updated the base translation copy to French-first CleanGo wording.
- Updated invoice and user-agent wording from UltraWash/laundry to CleanGo/waste collection.

## Notes

- The old laundry catalog/admin management pages still exist in the codebase for migration history, but launch navigation no longer points customers to those pages.
- The launch paths now use CleanGo logo, colors `#1073E6`, `#16A34A`, `#0F172A`, `#F1F5F9`, and French-first copy.

## Main Launch Paths Checked

- `/`
- `/login`
- `/signup`
- `/about`
- `/contact`
- `/subscription-plans`
- `/dashboard`
- `/admin/login`
- `/delivery/login`
