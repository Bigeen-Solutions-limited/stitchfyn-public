# StitchFYN marketing site

The public site at www.stitchfyn.com. Plain static HTML, one stylesheet and jQuery. There is no build step and no npm dependencies.

## Run locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Pages

| File | Clean URL | Purpose |
|---|---|---|
| `index.html` | `/` | Short home page: hook, pattern, two stories, three benefits, Apply |
| `how-it-works.html` | `/how-it-works` | The four steps, with a link to the guide |
| `features.html` | `/features` | What the app does |
| `verify.html` | `/verify` | The Fabric Safety Seal and the seal-code check |
| `faq.html` | `/faq` | Questions tailors ask |
| `early-adopters.html` | `/early-adopters` | The cohort, two stories and the apply form |
| `guide.html` | `/guide` | Step-by-step guide with screenshots |
| `privacy.html` | `/privacy` | Privacy notice |
| `404.html` | — | Served for any missing path |

Each page except Early Adopters ends with one "Next" link, in the order above (the guide's Next goes to Early Adopters).

Link between pages with the relative `.html` file name (`features.html`). Canonical URLs, `og:url` and `sitemap.xml` use the clean URL (`https://www.stitchfyn.com/features`), because the host serves pages without the extension. Add every new page to `sitemap.xml`.

Every public claim must match what the app does today (see `DECISIONS.md`, DEC-001, in the parent folder). Check new wording against the app before it goes live.

## Shared header, footer and Apply bar

The nav, the footer and the phone Apply bar are written once in `partials/` and copied into every page by a small script (Node built-ins only):

```bash
node scripts/sync-partials.mjs          # write the shared markup into every page
node scripts/sync-partials.mjs --check  # exit 1 if any page is out of date
```

Edit the partial, then run the script. Do not edit the markup between the `<!-- header:start … -->` and `<!-- header:end -->` markers (and the `footer` and `apply-bar` ones) inside a page; the next run overwrites it.

The script:
- marks the current page's links with `aria-current="page"`;
- writes `APP_URL + "/login"` (read from `main.js`) into the Sign in links, so they work without JavaScript;
- leaves the Apply bar out of `early-adopters.html`, where the form already is;
- gives `privacy.html` a solid nav, because it has no green header for the transparent nav to sit on.

Running it twice changes nothing. To add a page, add it to `PAGES` at the top of the script.

## Old links

The site used to be one long page. `main.js` sends old section links on the home page (`/#how`, `/#platform`, `/#proof`, `/#faq`, `/#founding`, `/#verify`) to the new pages. `/#pattern` stays on the home page. The server never sees the part after `#`, so this has to happen in the browser. `_redirects` (Cloudflare Pages) covers old path-style aliases such as `/apply`.
