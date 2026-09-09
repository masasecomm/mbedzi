# KeywordCatch — marketing site

A static landing page for a paid subscription to a live trending-queries feed.
Plain HTML/CSS/JS — no build step, no framework, so it deploys straight to
GitHub Pages.

## 1. Deploy to Cloudflare Pages

1. Push the project to a Git repository.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com), open **Workers
   & Pages → Create application → Pages → Connect to Git**.
3. Select the repository, choose the project root as the build directory, and
   leave the build command empty because this is a static site.
4. Deploy the site. Cloudflare Pages automatically detects the `functions/`
   directory and serves `/api/contact`.
5. Add the Turnstile secret in **Settings → Environment variables** as:
   `TURNSTILE_SECRET`.
6. Add `FORM_SUBMIT_EMAIL` as a secret environment variable with the recipient
   address. Keep both values out of HTML, JavaScript, Git, and this README.
7. Use the secret from the existing Turnstile widget. Never put it in HTML,
   JavaScript, Git, or this README.

For the private live sheet view, add `GOOGLE_SHEET_URL` as another secret
environment variable. Set it to the Google Sheets CSV or JSON export URL. The
`test.html` page requests `/api/sheet`, and the Pages Function fetches the
Google source server-side so visitors cannot see the source URL. The page
refreshes the data every 60 seconds.

The contact form requires Cloudflare Pages because Turnstile must be checked
server-side before the message is forwarded.

## 2. Contact form and Turnstile

The contact form embeds the existing Turnstile widget and posts to the Pages
Function at `functions/api/contact.js`. That function:

- verifies `cf-turnstile-response` with Cloudflare Siteverify;
- requires the `contact` action and a successful verification;
- removes the Turnstile token before forwarding the message to
   FormSubmit using the private `FORM_SUBMIT_EMAIL` variable.

The function cannot send messages until `TURNSTILE_SECRET` is configured in
Cloudflare Pages. Do not test the production form until that variable is set.

## 3. Private sheet test page

Open `/test.html` after adding `GOOGLE_SHEET_URL`. The source sheet must be
available through its export URL to the Cloudflare Worker. For a private sheet,
use a server-side Google API or service-account integration instead of putting
credentials in the page; never expose a Google access token in the browser.

## 4. Wiring up billing

GitHub Pages can only serve static files, so there's no server here to
process payments. The standard way to sell a subscription from a static
site is **Stripe Payment Links** — Stripe hosts the actual checkout, you
just link to it:

1. In the [Stripe Dashboard](https://dashboard.stripe.com), go to
   **Product catalog → Add product**, and create one product per plan
   (e.g. "KeywordCatch Pro", $29/month recurring).
2. On each product, click **Create payment link**. Stripe gives you a URL
   like `https://buy.stripe.com/xxxxxxxx`.
3. Open `script.js` and paste your links into `CHECKOUT_LINKS`:

   ```js
   const CHECKOUT_LINKS = {
     starter: '#',                                   // your signup page
     pro: 'https://buy.stripe.com/your_pro_link',
     business: 'https://buy.stripe.com/your_business_link',
   };
   ```

4. Point `starter` at wherever a free account actually gets created (a
   signup form, an email capture, etc.) — Stripe Payment Links are for
   paid plans.

Stripe handles the card form, receipts, tax, retries on failed cards, and
the customer billing portal for cancellations — none of that needs to be
built. Once someone subscribes, use
[Stripe webhooks](https://docs.stripe.com/webhooks) on your backend (or a
tool like Zapier/Make, which this product already streams into) to grant
access — that part does need something other than GitHub Pages, since it's
server-side logic.

## 5. Connecting a real feed

The hero terminal currently loops over a small hardcoded sample list in
`script.js` (`SAMPLE_QUERIES`) purely for visual demo purposes — it's
labeled "Simulated preview" on the page. To show your real, live feed
instead, replace the `pushRow()` logic with a call to wherever your feed
actually lives (e.g. poll an API endpoint, or open a WebSocket/SSE
connection) and push each real query into the terminal the same way.

## 6. Customizing

- **Colors, type, spacing** — all in `styles.css`, driven by the CSS
  custom properties at the top of the file (`:root { ... }`).
- **Copy** — all in `index.html`, plain text, no templating.
- **Pricing numbers** — the `<table class="price-table">` in `index.html`.
- **Rename the product** — search `index.html` and `styles.css`... actually
  just `index.html` for "KeywordCatch" and swap in your name; there's no
  other place it's referenced.

## File structure

```
index.html    All page markup and copy
styles.css    All styling (design tokens at the top)
   script.js     Live-feed demo + contact form behavior
   test.html     Private live Google Sheet view
   functions/    Cloudflare Pages server-side handlers
README.md     This file
```
