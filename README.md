# PlusMinus Admin V2 — Fixed

This is a static prototype for the current PlusMinus project.

## Fixed
- Admin link removed from the public homepage.
- Search tabs (All, News, Images, Videos, Maps) are clickable and render prototype states.
- Admin opens directly as a dashboard; the submission form is NOT open by default.
- Submit New Site opens the modal.
- Add-site modal closes with X, backdrop tap, Escape, or successful submission.
- Reject has a proper reason dialog.
- Pending / Approved / Rejected filters work.
- Re-review returns a rejected/approved site to Pending.
- Mobile page scrolling and modal scrolling are fixed.
- Data remains in browser localStorage for now. This is not authentication or a secure production admin system.

## Deployment
Replace the existing project files in the GitHub `plusminus` repository with these files at the repository root. Vercel should auto-deploy the connected project.

Admin is currently reachable directly at `/admin.html`. The public homepage does not expose an Admin link. Proper authentication/protected admin routing can be added later.
