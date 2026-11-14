// Keeps the header, footer and phone Apply bar identical on every page (DEC-017).
//
// The site is plain static HTML with no build step, so shared markup lives in
// partials/ and is copied into each page by this script:
//
//   partials/header.html     the nav and the phone menu
//   partials/footer.html     the footer
//   partials/apply-bar.html  the Apply bar fixed to the bottom of phone screens
//
// In a partial, {{SIGN_IN_URL}} becomes APP_URL + "/login", read from main.js
// (or "#" while APP_URL is empty, and main.js then hides the link).
// The link to the page being written gets aria-current="page".
//
//   node scripts/sync-partials.mjs          write the shared markup into every page
//   node scripts/sync-partials.mjs --check  exit 1 if any page is out of date
//
// Edit the partials, then run this. Do not hand-edit the generated markup in a page.
// Node built-ins only; running it twice changes nothing.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

// Every page that carries the shared markup.
//   current:  the href marked aria-current="page" (null on home and privacy)
//   applyBar: false where the apply form is already on the page
//   solidNav: true where the page has no green hero under the nav
const PAGES = {
  "index.html": { current: null },
  "how-it-works.html": { current: "how-it-works.html" },
  "features.html": { current: "features.html" },
  "verify.html": { current: "verify.html" },
  "faq.html": { current: "faq.html" },
  "guide.html": { current: "guide.html" },
  "early-adopters.html": { current: "early-adopters.html", applyBar: false },
  "privacy.html": { current: null, solidNav: true },
};

const appUrl = (readFileSync(join(root, "main.js"), "utf8").match(/const APP_URL = '([^']*)'/) || [])[1];
if (appUrl === undefined) {
  console.error("main.js: could not read const APP_URL");
  process.exit(1);
}
const signInUrl = appUrl ? `${appUrl}/login` : "#";

const read = (name) =>
  readFileSync(join(root, "partials", name), "utf8").replace(/\r\n/g, "\n").trimEnd().replaceAll("{{SIGN_IN_URL}}", signInUrl);

const partials = {
  header: read("header.html"),
  footer: read("footer.html"),
  "apply-bar": read("apply-bar.html"),
};

const start = (name) =>
  `<!-- ${name}:start (generated from partials/${name}.html; edit the partial, then run scripts/sync-partials.mjs) -->`;
const end = (name) => `<!-- ${name}:end -->`;

function blockFor(name, opts) {
  let body = partials[name];
  if (name === "apply-bar" && opts.applyBar === false) {
    body = "<!-- No Apply bar here: the apply form is on this page. -->";
  }
  if (name === "header" && opts.solidNav) {
    body = body.replace('<nav class="nav" id="nav"', '<nav class="nav is-scrolled" id="nav" data-nav-solid');
  }
  if (opts.current) {
    body = body.replaceAll(`href="${opts.current}"`, `href="${opts.current}" aria-current="page"`);
  }
  return `${start(name)}\n${body}\n${end(name)}`;
}

// Where each block goes the first time, before a page has markers.
const firstTime = {
  header: (src, block) => (/<nav class="nav[^"]*"[\s\S]*?<\/nav>/.test(src) ? src.replace(/<nav class="nav[^"]*"[\s\S]*?<\/nav>/, () => block) : null),
  footer: (src, block) => (/<footer class="footer">[\s\S]*?<\/footer>/.test(src) ? src.replace(/<footer class="footer">[\s\S]*?<\/footer>/, () => block) : null),
  "apply-bar": (src, block) => {
    const at = src.search(/<script src="https:\/\/code\.jquery\.com/);
    const i = at !== -1 ? at : src.lastIndexOf("</body>");
    return i === -1 ? null : `${src.slice(0, i)}${block}\n\n${src.slice(i)}`;
  },
};

let stale = 0;
let failed = 0;

for (const [page, opts] of Object.entries(PAGES)) {
  const path = join(root, page);
  if (!existsSync(path)) {
    console.error(`${page}: missing`);
    failed++;
    continue;
  }
  const raw = readFileSync(path, "utf8");
  const crlf = raw.includes("\r\n");
  const src = raw.replace(/\r\n/g, "\n");
  let next = src;

  for (const name of Object.keys(partials)) {
    const block = blockFor(name, opts);
    const marked = new RegExp(`<!-- ${name}:start[^>]*-->[\\s\\S]*?<!-- ${name}:end -->`);
    if (marked.test(next)) {
      next = next.replace(marked, () => block);
    } else {
      const placed = firstTime[name](next, block);
      if (placed === null) {
        console.error(`${page}: nowhere to put the ${name}`);
        failed++;
        continue;
      }
      next = placed;
    }
  }

  if (next !== src) {
    stale++;
    if (check) console.log(`${page}: out of date`);
    else writeFileSync(path, crlf ? next.replace(/\n/g, "\r\n") : next, "utf8");
  }
}

const count = Object.keys(PAGES).length;
if (failed) process.exit(1);
if (check) {
  if (stale) process.exit(1);
  console.log(`partials up to date on ${count} pages`);
} else {
  console.log(`partials written to ${count} pages (${stale} changed)`);
}
