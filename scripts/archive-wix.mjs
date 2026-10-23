/** Public, read-only archive of the legacy AI Club Wix site. Run: node scripts/archive-wix.mjs */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as cheerio from 'cheerio';
const exec = promisify(execFile);
const base = 'https://aiclubwebdev.wixsite.com/aiclub-2';
const root = path.resolve('archives/wix-ai-club');
const clean = s => (s || '').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
const slug = url => new URL(url).pathname.replace('/aiclub-2','').replace(/^\/+|\/+$/g,'').replace(/[^a-zA-Z0-9_-]/g,'--') || 'home';
const absolute = (s, from=base) => { try { return new URL(s,from).href; } catch { return s; } };
const json = async (file,data) => fs.writeFile(path.join(root,file),JSON.stringify(data,null,2)+'\n');
async function download(url, file, max=20_000_000) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  const {stdout}=await exec('curl',['-L','--fail','--silent','--show-error','--retry','2','--max-time','60','--max-filesize',String(max),'-w','%{http_code}\n%{url_effective}\n%{content_type}',url,'-o',file],{maxBuffer:1024*1024});
  const [status,finalUrl,contentType]=stdout.trim().split('\n');
  return {status:Number(status),finalUrl,contentType,bytes:(await fs.stat(file)).size};
}
for(const d of ['raw','pages','assets','discovery']) await fs.mkdir(path.join(root,d),{recursive:true});
const manifest={source:base,startedAt:new Date().toISOString(),pages:[],assets:[],discovery:[],skippedRoutes:[],limits:{maxAssetBytes:20000000,scope:'Public pages under /aiclub-2; external destinations indexed, not recursively crawled.'}};
const queue=[base,base+'/projects']; const seen=new Set();const assets=new Map();const links=[];const routes=new Map();
function enqueue(url){try{const u=new URL(url);u.hash='';u.search='';const s=u.href.replace(/\/$/,'');if(u.origin===new URL(base).origin&&(u.pathname==='/aiclub-2'||u.pathname.startsWith('/aiclub-2/'))&&!seen.has(s)&&!queue.includes(s))queue.push(s);}catch{}}
function addAsset(url,page,kind='media'){
  url=absolute(url).replaceAll('&amp;','&');
  if(!/^https?:/.test(url))return;
  if(url.includes('static.wixstatic.com/media/'))url=url.split('/v1/')[0].split('?')[0];
  if(!assets.has(url))assets.set(url,{url,kind,pages:[]});
  if(!assets.get(url).pages.includes(page))assets.get(url).pages.push(page);
}
for(const endpoint of ['robots.txt','sitemap.xml']){
 const url=endpoint==='robots.txt'?'https://aiclubwebdev.wixsite.com/robots.txt':`${base}/${endpoint}`;
 try{const file=`discovery/${endpoint}`;const res=await download(url,path.join(root,file));manifest.discovery.push({url,file,...res});
 if(endpoint==='sitemap.xml'){const xml=await fs.readFile(path.join(root,file),'utf8');const $=cheerio.load(xml,{xml:true});for(const loc of $('loc').map((i,e)=>$(e).text()).get()){
 if(loc.endsWith('.xml')){try{const sub=`discovery/${new URL(loc).pathname.split('/').pop()}`;const rr=await download(loc,path.join(root,sub));manifest.discovery.push({url:loc,file:sub,...rr});const sm=cheerio.load(await fs.readFile(path.join(root,sub),'utf8'),{xml:true});sm('loc').each((i,e)=>enqueue(sm(e).text()));}catch(e){manifest.discovery.push({url:loc,error:e.message});}}
 else enqueue(loc);
 }}
 }catch(e){manifest.discovery.push({url,error:e.message});}
}
while(queue.length && seen.size<150){
 const url=queue.shift();if(seen.has(url))continue;seen.add(url);const name=slug(url);const file=`raw/${name}.html`;
 console.log(`Page ${seen.size}: ${url}`);
 try{
 const response=await download(url,path.join(root,file));const html=await fs.readFile(path.join(root,file),'utf8');const $=cheerio.load(html);
 const modelText=$('#wix-viewer-model').text();let model={};try{model=JSON.parse(modelText);}catch{}
 const router=model.siteFeaturesConfigs?.router;
 if(router){for(const [route,def] of Object.entries(router.routes||{})){const target=base+'/'+route.replace(/^\.\//,'');routes.set(target,{url:target,...def,...router.pagesMap?.[def.pageId]});if(def.type==='Static')enqueue(target);else if(!manifest.skippedRoutes.some(r=>r.url===target))manifest.skippedRoutes.push({url:target,reason:'Dynamic account/profile route: no public user identifier; no sign-in attempted.'});}}
 const pageLinks=$('a[href]').map((i,e)=>({text:clean($(e).text())||$(e).attr('aria-label')||$(e).find('img').attr('alt')||'',url:absolute($(e).attr('href'),url),target:$(e).attr('target')||null})).get();
 for(const l of pageLinks){links.push({page:url,...l});if(!/\/(account|profile)(\/|$)/.test(l.url))enqueue(l.url);}
 const images=$('img').map((i,e)=>({alt:$(e).attr('alt')||'',src:absolute($(e).attr('src')||'',url),srcset:$(e).attr('srcset')||null,width:$(e).attr('width')||null,height:$(e).attr('height')||null})).get();
 for(const img of images)if(img.src!==url)addAsset(img.src,url,'image');
 // Preserve background originals and lazy media references buried in public Wix configuration.
 for(const match of html.replaceAll('\\/','/').matchAll(/https:\/\/(?:static\.wixstatic\.com\/media\/|video\.wixstatic\.com\/video\/|docs\.wixstatic\.com\/ugd\/|static\.wixstatic\.com\/ugd\/)[^\s"'<>\\)]+/g))addAsset(match[0],url);
 for(const match of html.matchAll(/https:\/\/[^\s"'<>\\)]+\.(?:woff2?|ttf)(?:\?[^\s"'<>\\)]*)?/g))addAsset(match[0],url,'font');
 const forms=$('form').map((i,e)=>({action:$(e).attr('action')||null,method:$(e).attr('method')||null,fields:$(e).find('input,textarea,select,button').map((j,f)=>({tag:f.tagName,type:$(f).attr('type')||null,name:$(f).attr('name')||null,label:$(f).attr('aria-label')||$(f).attr('placeholder')||clean($(f).text())})).get()})).get();
 const embeds=$('iframe,video,audio,source').map((i,e)=>({tag:e.tagName,src:$(e).attr('src')||null,title:$(e).attr('title')||null,poster:$(e).attr('poster')||null})).get();
 const buttons=$('button,[role="button"]').map((i,e)=>({text:clean($(e).text()),label:$(e).attr('aria-label')||null,id:$(e).attr('id')||null,attributes:Object.fromEntries(Object.entries(e.attribs||{}).filter(([k])=>k.startsWith('data-')||k.startsWith('aria-')))})).get();
 $('script,style,noscript,svg').remove();
 const scope=$('#SITE_PAGES').length?$('#SITE_PAGES'):$('main').length?$('main'):$('body');
 const blocks=scope.find('h1,h2,h3,h4,h5,h6,p,li,table').filter((i,e)=>!$(e).parents('li,table').length).map((i,e)=>({tag:e.tagName,id:$(e).attr('id')||$(e).closest('[id]').attr('id')||null,text:clean($(e).text()),links:$(e).find('a[href]').map((j,a)=>({text:clean($(a).text()),url:absolute($(a).attr('href'),url)})).get()})).get().filter(b=>b.text);
 const sections=scope.find('section').map((i,e)=>({id:$(e).attr('id')||null,text:clean($(e).text()),images:$(e).find('img').map((j,img)=>({src:$(img).attr('src'),alt:$(img).attr('alt')||''})).get()})).get();
 const data={url,fetchedAt:new Date().toISOString(),...response,title:$('title').text(),description:$('meta[name="description"]').attr('content')||'',canonical:$('link[rel="canonical"]').attr('href')||null,blocks,sections,links:pageLinks,images,embeds,forms,buttons,text:blocks.length?blocks.map(b=>b.text).join('\n\n'):clean(scope.text()),allPageText:clean($('body').text())};
 await json(`pages/${name}.json`,data);
 const md=[`# ${data.title||name}`,`Source: ${url}`,`Captured: ${data.fetchedAt}`,...blocks.map(b=>`${/^h[1-6]$/.test(b.tag)?'#'.repeat(Number(b.tag[1])+1)+' ':b.tag==='li'?'- ':''}${b.text}`),'## Links',...pageLinks.map(l=>`- [${l.text.replaceAll('[','\\[').replaceAll(']','\\]')||l.url}](${l.url})`),'## Images',...images.map(img=>`- ${img.alt||'(no alt text)'} — ${img.src}`)].join('\n\n');
 await fs.writeFile(path.join(root,`pages/${name}.md`),md+'\n');
 manifest.pages.push({url,title:data.title,file,json:`pages/${name}.json`,markdown:`pages/${name}.md`,...response,blocks:blocks.length,images:images.length});
 }catch(e){manifest.pages.push({url,error:e.message});}
}
await json('discovery/routes.json',[...routes.values()]);await json('links.json',links);
const entries=[...assets.values()];let at=0;
async function worker(){while(at<entries.length){const asset=entries[at++];const ext=new URL(asset.url).pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1]||'bin';const name=crypto.createHash('sha256').update(asset.url).digest('hex').slice(0,16)+'.'+ext;asset.file=`assets/${name}`;
try{Object.assign(asset,await download(asset.url,path.join(root,asset.file)));asset.sha256=crypto.createHash('sha256').update(await fs.readFile(path.join(root,asset.file))).digest('hex');}catch(e){asset.error=e.message;await fs.rm(path.join(root,asset.file),{force:true});delete asset.file;}manifest.assets.push(asset);if(manifest.assets.length%25===0)console.log(`Assets ${manifest.assets.length}/${entries.length}`);}}
await Promise.all([worker(),worker(),worker()]);
manifest.finishedAt=new Date().toISOString();manifest.pages.sort((a,b)=>a.url.localeCompare(b.url));manifest.assets.sort((a,b)=>a.url.localeCompare(b.url));await json('manifest.json',manifest);
console.log(JSON.stringify({pages:manifest.pages.length,failedPages:manifest.pages.filter(p=>p.error).length,assets:entries.length,failedAssets:manifest.assets.filter(a=>a.error).length},null,2));
