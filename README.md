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
the three newest records whose status is `published`.

The upcoming-event panel is intentionally a placeholder. Once details are confirmed,
edit `src/data/announcements.json`; do not add a countdown unless a real future date is
known.

### Add or edit a blog

Edit `src/data/blogs.json`. Store the publisher's reading-time label in `readingMinutes`.
If the publisher does not supply one, add a verified `wordCount`; the UI estimates reading
time at 200 words per minute. Use `null` plus a TODO when neither value can be verified.
The homepage automatically shows the three newest published blog records.

Blog descriptions must be copied or closely paraphrased from the linked article. Keep
`descriptionSource` and `readingTimeSource` so future maintainers can verify the card.

### Add a team member

Edit `src/data/team.json` and add an item to `members`:

```json
{
  "id": "unique-slug",
  "name": "Verified name",
  "role": "Verified role",
  "year": "26-27",
  "group": "club",
  "image": "/images/member-photo.webp",
  "url": "https://optional-profile.example"
}
```

`group` must match an entry in `groups`. Add the photo to `public/images/` and use useful
alt text through the member's verified name. The desktop grid supports five members per
row, with three on tablet and two on mobile.

### Enable the contact form

The old Framer form had no verifiable delivery endpoint. Until one is supplied, the site
shows a working email link. Add the approved static form endpoint to
`site.json > contact.endpoint`; the existing form fields then render automatically.

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
- Some Medium pages could not be read reliably. Their missing descriptions and reading times
  remain explicit TODOs in `src/data/blogs.json`.
- The newest CartPole article has no destination URL on the source site.
- The contact form needs an approved form endpoint.
- The 2026–27 upcoming event and event archive await confirmed content.

See `docs/inventory.md` for the full source-page, interaction, token, and defect inventory.
