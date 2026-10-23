import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
const root=path.resolve('archives/wix-ai-club');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const save=(f,d)=>fs.writeFile(path.join(root,f),JSON.stringify(d,null,2)+'\n');
const clean=s=>(s||'').replace(/\u00a0/g,' ').replace(/[\t ]+/g,' ').trim();
const localAsset=src=>manifest.assets.find(a=>a.url===src?.split('/v1/')[0]?.split('?')[0])?.file||null;
const catalog=[];
for(const page of manifest.pages.filter(p=>p.json)){
 const data=JSON.parse(await fs.readFile(path.join(root,page.json),'utf8'));
 const $=cheerio.load(await fs.readFile(path.join(root,page.file),'utf8'));
 const model=JSON.parse($('#wix-viewer-model').text()||'{}');
 const embeddedData=$('script[type="application/ld+json"]').map((i,e)=>{try{return JSON.parse($(e).text());}catch{return {unparsed:$(e).text()};}}).get();
 const cards=$('.wixui-repeater__item').map((i,e)=>{
  const item=$(e);const textBlocks=item.find('h1,h2,h3,h4,h5,h6,p').map((j,t)=>clean($(t).text())).get();
  return {id:item.attr('id')||null,textBlocks,links:item.find('a[href]').map((j,a)=>({text:clean($(a).text()),url:$(a).attr('href')})).get(),images:item.find('img').map((j,img)=>({alt:$(img).attr('alt')||'',url:$(img).attr('src'),localFile:localAsset($(img).attr('src'))})).get(),backgroundMedia:[...new Set(($.html(e).match(/https:\/\/static\.wixstatic\.com\/media\/[^\s"'<>\\)]+/g)||[]).map(s=>s.split('/v1/')[0]))].map(url=>({url,localFile:localAsset(url)}))};
 }).get();
 data.cards=cards;data.structuredMetadata=embeddedData;data.images=data.images.map(i=>({...i,localFile:localAsset(i.src)}));
 // Public Wix component configuration is retained in raw HTML; expose page definitions separately.
 data.pageDefinitions=Object.values(model.siteFeaturesConfigs?.router?.pagesMap||{});
 await save(page.json,data);
 catalog.push({url:page.url,title:page.title,file:page.json,sections:data.sections.map(s=>({id:s.id,text:s.text})),cards});
}
await save('catalog.json',catalog);
const good=manifest.pages.filter(p=>p.json),failed=manifest.pages.filter(p=>p.error),downloaded=manifest.assets.filter(a=>a.file),missing=manifest.assets.filter(a=>a.error);
const lines=[
'# Legacy AI Club Wix website archive',
'',
'Source: https://aiclubwebdev.wixsite.com/aiclub-2/projects',
'',
`Captured on **${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'}).format(new Date(manifest.startedAt))} (Asia/Kolkata)**. Machine-readable timestamps in the manifest are UTC.`,
'',
'This is a historical content archive, separate from the live Astro website. Original spelling, names, dates, roles and descriptions are preserved. Labels such as “Current Projects” describe the old site at capture time, not the current AI Club tenure. No missing dates or facts have been inferred.',
'',
'## Coverage',
'',
`- ${good.length} successful page captures; ${failed.length} failed page requests (listed below).`,
`- ${downloaded.length} downloaded media/font files; ${missing.length} unsuccessful asset downloads.`,
'- Discovery used navigation links, the XML sitemap and its event/program/page sitemaps, and the public Wix router page map. Older pages omitted from the main navigation are included.',
'- Includes home/about/contact copy, achievements, projects, team names and roles, LinkedIn/social links, event descriptions and schedules, blog titles/authors/links, resources, galleries, archives and public course/program pages.',
'',
'## Files',
'',
'- `pages/*.md`: readable page text and source links. Start with [Projects](pages/projects.md), [Team](pages/team.md), [Events](pages/events-1.md), [Blogs](pages/blogs.md), and [Home](pages/home.md).',
'- `pages/*.json`: page text in source order, sections, repeated cards, image alt text and local asset references, links, forms, buttons, embeds and structured metadata. Repeater cards preserve the relationship between text, images and links wherever Wix groups them.',
'- `catalog.json`: consolidated sections and repeated cards across all captured pages. Component IDs are retained for tracing content back to raw HTML.',
'- `links.json`: every discovered HTML anchor, including its source page and label. External destinations are references, not copies of the external sites.',
'- `assets/`: originals from Wix media URLs where available, plus discovered fonts. Hashed filenames avoid collisions; `manifest.json` maps each to its original URL, source pages, byte count, content type and SHA-256 checksum.',
'- `raw/*.html`: unmodified server responses for historical evidence, including Wix public page configuration, inline styles and scripts. These are archival snapshots, not maintainable application code and are not imported into Astro.',
'- `discovery/`: robots.txt, sitemaps, and public page routes (including routes absent from navigation).',
'- `manifest.json`: retrieval status, redirects, timestamps, files, checksums and download failures.',
'',
'## Limits and interpretation',
'',
'- This is a public server-rendered content capture, not a functioning offline Wix clone. Vendor runtime bundles are not mirrored. Animations, menus, galleries, search, forms and application widgets may require Wix services. No forms were submitted.',
'- Text that exists only after client-side interaction or authenticated requests may be absent from the readable extracts. Public inline configuration is preserved in the raw snapshots; the extracted text is not a claim that all interactive states were executed.',
'- Account/profile routes without public identifiers are recorded in the manifest but not accessed through sign-in. Public empty application shells may be archived without actual participant or payment data.',
'- Linked Google Drive documents, YouTube videos, external articles and LinkedIn profiles are indexed but are not recursively downloaded. Only media directly referenced on the old site is downloaded.',
'- Downloads are limited to 20 MB per asset to keep individual files reasonable for Git. Any failures/limits are recorded rather than silently omitted.',
'- Images retain source alt text (including empty or unhelpful alt text); no identities are inferred from photos.',
'- Home and /home are aliases and share the home extract.',
'',
'## Page index',
'',
'| Page | Extract | Original |',
'| --- | --- | --- |',
...good.map(p=>`| ${p.title.replaceAll('|','\\|')} | [Markdown](${p.markdown}) · [JSON](${p.json}) | [Source](${p.url}) |`),
'',
'## Retrieval exceptions',
'',
'Pages with no extracted text: '+good.filter(p=>p.blocks===0).map(p=>`[${p.url.split('/').pop()}](${p.url})`).join(', ')+'. These responses do not establish that the pages have no client-loaded content.',
'',
...failed.map(p=>`- Page ${p.url}: ${p.error.split('\n').find(line=>line.startsWith('curl:'))||p.error.split('\n')[0]}`),
...missing.map(a=>`- Asset ${a.url}: ${a.error.split('\n').find(line=>line.startsWith('curl:'))||a.error.split('\n')[0]}`),
...(failed.length+missing.length===0?['None for the discovered page/media requests.']:[]),
'',
'## Refresh',
'',
'From the repository root, after installing the existing dependencies:',
'',
'```sh',
'node scripts/archive-wix.mjs',
'node scripts/index-wix-archive.mjs',
'```',
'',
'The crawler uses Node.js, the existing Cheerio dependency and curl. It makes read-only public HTTP requests with three parallel asset downloads. Refreshing overwrites matching snapshots; review the diff and remove obsolete files deliberately if the source changes. This folder is not part of the published site.',
];
await fs.writeFile(path.join(root,'README.md'),lines.join('\n')+'\n');
console.log({pages:good.length,failed:failed.length,downloaded:downloaded.length,missing:missing.length,cards:catalog.reduce((s,p)=>s+p.cards.length,0)});
