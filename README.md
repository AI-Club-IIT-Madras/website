# AI Club, CFI, IIT Madras website

Static Astro + Tailwind rebuild of the AI Club website. The generated site contains no
Framer runtime and is ready for GitHub Pages. Content lives in JSON files so routine
updates do not require editing page components.

## Run locally

Use Node.js 22 or newer.

```sh
cd /path/to/website
npm install
npm run dev
```

Run these commands from the repository root—the directory that contains `package.json`.
For the current local checkout, that command is:

```sh
cd /Users/sbhandari/Documents/GitHub/website
```

Astro serves the project under `/website/` by default. Before committing, run:

```sh
npm run validate
```

This checks Astro templates and types, runs the content tests, makes a production build,
and verifies every generated local link and asset reference.

## Content files

| Content                                      | File                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| Site copy, navigation, contact, social links | `src/data/site.json`                                      |
| Events                                       | `src/data/events.json`                                    |
| Upcoming event placeholder                   | `src/data/announcements.json`                             |
| Blog cards                                   | `src/data/blogs.json`                                     |
| Projects and detail-page content             | `src/data/projects.json`, `src/data/project-details.json` |
| Team members and groups                      | `src/data/team.json`                                      |
| Publications and hackathon results           | `src/data/achievements.json`                              |
| Partner logos                                | `src/data/partners.json`                                  |

Images, fonts, and the background video are local files in `public/`. Public source- and
build-reference screenshots are kept in `reference/` for visual comparison.

### Add or edit an event

Edit `src/data/events.json`. A record needs a unique `id`, ISO `date`, human-readable
`displayDate`, `academicYear` (`25-26` or `26-27`), exact `description`, and `status`.
Set `image` or `resourceUrl` to `null` when unavailable. The homepage automatically shows
the three newest completed records whose status is `published`.

Upcoming and past events are determined from dates, not from whether a countdown exists.
Use `endDate` (`YYYY-MM-DD`) for a multi-day event. Without an end time, it stays active
until the end of its final day in **Asia/Kolkata**. Optionally set `endsAt` to an ISO
timestamp with timezone, such as `2026-10-21T18:30:00+05:30`, for an exact finish time.
`countdownTo` is the start timestamp; `registrationUrl` is shown only while the event
is active. Completed events automatically appear in the past archive and homepage
recent-event cards. All future published events appear in the upcoming archive.

The GitHub Pages workflow rebuilds daily at 12:17 AM IST (18:47 UTC), so the static
site moves completed events at the next daily rebuild without a content commit.
GitHub may delay scheduled runs, and schedules
must be enabled on the default branch. A manual workflow run refreshes it immediately.
No event records are deleted or moved between files. The legacy announcement placeholder
is only used when there are no published events in the current archive.

### Add or edit a blog

Edit `src/data/blogs.json`. Store the accessible article-body count in `wordCount` and set
`readingMinutes` to the word count divided by 200, rounded up. Recheck both values if the
article changes. Use `null` plus a TODO when the article has no verifiable URL or body. The
homepage automatically shows the three newest published blog records.

Blog descriptions must be copied or closely paraphrased from the linked article. Keep
`descriptionSource` and `readingTimeSource` so future maintainers can verify the card.

### Add a team member

Edit `src/data/team.json` and add an item to `members`:

```json
{
  "id": "unique-slug",
  "name": "Verified name",
  "role": "Verified role",
  "group": "viveka-2",
  "image": "/images/member-photo.webp",
  "url": "https://optional-profile.example"
}
```

`group` must match an entry in `groups`. Add the photo to `public/images/` and use useful
alt text through the member's verified name. Use `null` for `image` until a verified photo
is available. The core roster appears at `/team/`, club and hackathon coordinators appear
at `/team/coordinators/`, and each current project roster appears on its project detail
page. The desktop grid supports five members per row, with four on tablet, three on small
tablet, and two on mobile.

### Contact form

The contact form sends submissions to `aiclubcfi@smail.iitm.ac.in` through
[FormSubmit](https://formsubmit.co/), without opening the visitor's email app. The first
submission triggers a verification email to that inbox; a club mail administrator must
follow its confirmation link before FormSubmit delivers messages. Check the spam folder
if it does not arrive. The form uses a standard POST and shows FormSubmit's confirmation
page after submission; it works without JavaScript. If the club address changes,
update `site.json > email` and `site.json > contact.endpoint` together, then verify the
new address with FormSubmit. `site.json > contact.formUrl` identifies the published
site in FormSubmit's activation messages. After deploying, submit a test from
`https://aiclubcfi.com/` and activate the resulting email; do not use a local preview
to activate the published form.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys pushes to `main` using
GitHub's official Pages actions.

1. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
2. For the repository Pages URL, leave the defaults: `SITE_URL=https://ai-club-iit-madras.github.io`
   and `BASE_PATH=/website`.
3. For `aiclubcfi.com`, configure the custom domain in GitHub Pages, then add repository
   variables `SITE_URL=https://aiclubcfi.com` and `BASE_PATH=/`.
4. Add a `public/CNAME` file containing `aiclubcfi.com` once DNS is ready.

The first deployment still requires the repository owner to enable Pages and configure DNS.

## Known content TODOs

- The source `/team` page returns 404, so no names, roles, or photographs were invented.
- The newest CartPole article has no destination URL on the source site.
- The 2026–27 upcoming event and event archive await confirmed content.

See `docs/inventory.md` for the full source-page, interaction, token, and defect inventory.
