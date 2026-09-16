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

\n## Approval sync fix (V3.1)
Admin and public search now use `pm_sites_v3`. Existing `pm_sites_v2`/`pm_sites_v1` data is migrated automatically. The dummy approved sample was removed from the Admin data so the Approved count reflects actual approved submissions. Status values are normalized and the public search accepts approved status case-insensitively.
