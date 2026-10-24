<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- Render an editing form only after the store reports ready, and merge stored data into a draft only while that draft is still untouched — a slow load must never wipe what the user already typed.
- Keep school-date policy in schedule-days.ts so calendar changes apply consistently to lessons, homework, packing, reminders and exports.
- Keep annual calendar constants separate from the date engine; nextSchoolDay returns null when the configured school year has no remaining school days, preventing unbounded searches.
- Use shared validated calendar-setting forms and pass the stored calendar settings to every feature and export, so personal exceptions apply consistently.
- Keep all student data in one validated, versioned device-only store; use the same schemas for backup imports and form submissions to prevent invalid persisted records.
- Register the generated app-shell worker only through lib/pwa.ts, refusing development and preview contexts; use NetworkFirst for navigation and local bundled fonts to keep updates safe and personal data on-device.
