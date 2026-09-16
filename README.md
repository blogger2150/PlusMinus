# PlusMinus Admin V3 — clean prototype

This version keeps the public search page separate from Admin.

- Public homepage has no Admin link.
- Search tabs are clickable.
- Admin is available directly at `/admin.html`.
- Admin starts on the dashboard; the submit modal is closed initially.
- Add Website opens/closes correctly, including X, backdrop, and Escape.
- Pending / Approved / Rejected filters work.
- Approve / Reject / Re-review work.
- Approved websites are read by the public search from the same browser localStorage key: `pm_sites_v2`.
- This is still a browser-local prototype; Supabase should replace localStorage for shared data.

Do not expose `/admin.html` as a public navigation item. Proper Supabase Auth/RLS should be added before production admin use.
