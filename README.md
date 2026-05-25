# Genesis Core Systems — Website

Static marketing site for Genesis Core Systems. Zero build step, zero dependencies. Drop it on any static host.

## Stack

- Plain HTML + CSS + a touch of vanilla JS
- No frameworks, no bundlers, no Node, no tracking
- Inter + Manrope from Google Fonts (only network dependency)
- Dark mode, mobile nav, FAQ accordion, contact form — all in vanilla JS
- Logo colors sampled directly from the Genesis Core Systems logo

## Pages

| Page | Path |
|---|---|
| Home | `index.html` |
| Solutions | `solutions.html` |
| Services | `services.html` |
| Partnership | `partnership.html` |
| Articles | `articles.html` |
| About | `about.html` |
| FAQ | `faq.html` |
| Contact | `contact.html` |
| 404 | `404.html` |

## Deploy to GitHub Pages (free)

1. Push this repo to GitHub if it isn't already there.
2. In your repo: **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`.
4. Pick branch **`main`** and folder **`/ (root)`**, then **Save**.
5. After ~1 minute your site is live at `https://<your-username>.github.io/GCS/`.

The included `.nojekyll` file tells Pages to serve the files as-is (skipping Jekyll processing).

## Custom domain

1. In repo **Settings → Pages → Custom domain**, enter your domain (e.g. `genesiscoresystems.com`).
2. At your DNS provider, add either:
   - **Apex (`@`)**: four `A` records pointing to GitHub Pages IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
   - **Subdomain (e.g. `www`)**: one `CNAME` record pointing to `<your-username>.github.io`.
3. Wait for DNS to propagate, then check "Enforce HTTPS".

## Contact form

The contact form (`contact.html`) defaults to a `mailto:` fallback that opens the visitor's email client pre-filled and addressed to `osavir@yahoo.com`. To upgrade to async submissions:

1. Sign up at [formspree.io](https://formspree.io) (free tier covers 50 submissions/month).
2. Create a new form, copy the endpoint (looks like `https://formspree.io/f/abc123`).
3. In `contact.html`, change the form's `action="#mailto-fallback"` to the Formspree endpoint.

Alternatives: [Netlify Forms](https://www.netlify.com/products/forms/) (if hosted on Netlify), [Web3Forms](https://web3forms.com), or [Getform](https://getform.io).

## Customizing

- **Brand colors** live in `assets/styles.css` as CSS variables on `:root` (light) and `[data-theme="dark"]`.
- **Logo** is an inline SVG embedded in each page header/footer plus the standalone `assets/logo.svg`.
- **Contact info** (email, phone) appears in every page's footer and on `contact.html`. Search-and-replace `osavir@yahoo.com` and `+19144772673` to update.

## Local preview

Just open `index.html` in a browser. For a proper localhost (recommended so relative links and the 404 page behave correctly):

```bash
# Python 3
python -m http.server 8080
# then visit http://localhost:8080
```

## License

All rights reserved.
