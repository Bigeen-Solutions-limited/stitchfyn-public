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

## Configuration (top of `main.js`)

| Setting | Value | What it does |
|---|---|---|
| `FORMSPREE_ENDPOINT` | `https://formspree.io/f/movwonva` | Where the Early Adopter form posts |
| `APP_URL` | `https://app.stitchfyn.com` | Turns on the Sign in links and the seal check on `verify.html`, which opens `APP_URL/public/seals/<code>`. After changing it, run `node scripts/sync-partials.mjs` so the pages' Sign in links match |
| `CF_ANALYTICS_TOKEN` | empty | Cloudflare Web Analytics (DEC-012). Empty means no analytics script loads |

### Turning on Cloudflare Web Analytics

Use one of these, not both (both would count every visit twice):

1. **Automatic setup (no code change).** In the Cloudflare dashboard, turn on Web Analytics for the Pages project (under the project's metrics; menu names change from time to time). Cloudflare then adds the beacon itself. Leave `CF_ANALYTICS_TOKEN` empty.
2. **Token in `main.js`.** In the dashboard's Web Analytics section, add the site, copy the token from the JS snippet it shows, and paste it into `CF_ANALYTICS_TOKEN`. `main.js` then adds `https://static.cloudflareinsights.com/beacon.min.js` with `data-cf-beacon` on every page.

Cloudflare Web Analytics sets no cookies; DEC-012 chose it over Google Analytics partly to avoid a consent banner. `privacy.html` describes it under "Counting visits"; keep that paragraph in step with whichever analytics is actually on.

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
