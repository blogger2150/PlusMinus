# PlusMinus Admin V2

Admin V2 is a mobile-fix revision of Admin V1 for the existing PlusMinus project.

Fixes included:
- Admin page can scroll normally on mobile screens.
- Add Website modal has a reliable close button using explicit event listeners.
- Modal backdrop and Escape-key closing are supported.
- Modal is internally scrollable on short mobile screens.
- Admin actions use delegated event listeners instead of inline handlers.
- Existing localStorage key `pm_sites_v1` is preserved so current browser data is not reset.

Deploy this version to the existing `plusminus` GitHub/Vercel project and keep the current domain.

## Approved Sites → Search
Admin and public search now use the same `pm_sites_v2` browser storage key.
When a website is approved in Admin, it becomes eligible for the public search prototype immediately in the same browser/device. Rejected and pending sites are excluded.
This is still a prototype connection; cross-device/public users require Supabase or another server-side database.
