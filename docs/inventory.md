# Source inventory

Inspected https://aiclubcfi.com/ on 2026-10-03. The repository was empty;
`reference/source` contains captured live-site screenshots, not user-provided designs.

| Route                     | Content                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| /                         | Hero, club introduction, latest events, latest blogs, partners, contact form, footer |
| /events                   | Bharat Bricks feature, countdown, five event descriptions and resource links         |
| /achievements             | Five research publications, one patent, industry partners, nine hackathon results    |
| /blog                     | Introduction and 21 article cards                                                    |
| /projects-25-26           | Viveka, Deep Recall, SpeechSeek                                                      |
| /projects-26-27           | Viveka 2.0, triton::cu, KathAI, partners                                             |
| /projects-26-27/triton-cu | Introduction, application embed, team/publications placeholders                      |
| /projects-26-27/kathai    | Introduction, application embed, team/publications placeholders                      |
| /team                     | Broken destination (404)                                                             |

## Interaction and asset inventory

- Desktop Projects dropdown; mobile hamburger; contact and event anchor links.
- Hero entrance effects and muted, looping particle video.
- Card links, countdown, Name/Email/Message form, application-document iframes.
- Images: club logo, event posters, article thumbnails, project illustrations, partner logos.
- Instrument Sans (display), Open Sans (body), Inter (UI).
- Black/#080808 backgrounds, white text, translucent white borders; 10px/20px radii.
- Source responsive boundaries: 810px and 1200px.
- External destinations: 20 blog URLs, four resource folders, six publication/patent links,
  Luma registration, Viveka subsite, six social profiles. Several external destinations
  could not be fully inspected due to loading/access failures.

## Approved differences

- Blog cards use text left/image right, three columns on laptops and four on wide screens,
  with year groups, descriptions and reading times when verifiable.
- Events have 2025–26 and 2026–27 archives. Existing content belongs to 2025–26.
- Upcoming event becomes a placeholder with no countdown or registration CTA.
- Homepage previews sort shared records by date and exclude placeholders.
- Shared video on every page, accessible transitions, redesigned aligned footer.
- Responsive team grid supporting more than three members per row; missing data is TODO.

## Source defects

Team and several project buttons point home. /team is absent. KathAI points to the
Triton team anchor. CartPole has no link. Mobile menu clips and scrolls horizontally.
Mobile contact forms are duplicated, and event anchors differ from desktop.
The upcoming counter is zero. Footer addresses vary. Image alt text is often unrelated.
Some project sections and application content are incomplete. Preserve editorial text;
do not invent missing members, dates, links or factual descriptions.
