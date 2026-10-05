import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, normalize, relative, resolve } from "node:path";
import { load } from "cheerio";

const root = resolve("dist");
const htmlFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
  }
}

function outputPath(urlPath) {
  let pathname = urlPath.replace(/^\/website/, "") || "/";
  pathname = pathname.split(/[?#]/)[0];
  if (extname(pathname)) return join(root, pathname);
  return pathname.endsWith("/")
    ? join(root, pathname, "index.html")
    : join(root, `${pathname}.html`);
}

walk(root);
const errors = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const $ = load(html);
  const page = `/${relative(root, file)}`;

  if (!$("main").length) errors.push(`${page}: missing <main>`);
  if ($("h1").length !== 1)
    errors.push(`${page}: expected one <h1>, found ${$("h1").length}`);
  if (!$('meta[name="description"]').attr("content"))
    errors.push(`${page}: missing meta description`);
  if (/framer\.com\/m\//i.test(html))
    errors.push(`${page}: contains a Framer runtime reference`);

  $("a[href], img[src], source[data-src], link[href]").each((_, element) => {
    const attribute =
      element.name === "source"
        ? "data-src"
        : element.name === "img"
          ? "src"
          : "href";
    const value = $(element).attr(attribute);
    if (!value || /^(https?:|mailto:|#|data:)/.test(value)) return;
    if (!value.startsWith("/website/")) return;
    const target = outputPath(value);
    if (!existsSync(target))
      errors.push(
        `${page}: missing local target ${value} (${normalize(target)})`,
      );
  });
}

for (const required of [
  "404.html",
  "sitemap-index.xml",
  "index.html",
  "blog/index.html",
  "team/index.html",
]) {
  if (!existsSync(join(root, required)))
    errors.push(`missing build output: ${required}`);
}

const home = load(readFileSync(join(root, "index.html"), "utf8"));
const contactForm = home("#contact-form");
if (contactForm.attr("method")?.toLowerCase() !== "post")
  errors.push("homepage: contact form must use POST");
if (!contactForm.attr("action")?.startsWith("https://formsubmit.co/"))
  errors.push("homepage: contact form is missing its delivery endpoint");
if (
  contactForm.find('[name="_url"]').attr("value") !== "https://aiclubcfi.com/"
)
  errors.push("homepage: contact form must identify the published website");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Validated ${htmlFiles.length} HTML pages and their local asset/route references.`,
);
