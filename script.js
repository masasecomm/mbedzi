/* ============================================================
   TrendPulse — site script
   Two independent jobs:
   1. Animate the hero "live feed" terminal with sample data.
   2. Send each pricing button to the right place — a Stripe
      Payment Link for paid plans, a signup page for the free plan.
   ============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

/* ------------------------------------------------------------
   1. Live feed demo
   This is illustrative only — it loops over a fixed sample list
   so the page has something honest to show without a backend.
   Swap SAMPLE_QUERIES for a real feed once your API is live
   (see README "Connecting a real feed").
   ------------------------------------------------------------ */
const SAMPLE_QUERIES = [
  ['Sports', 'Champions League draw'],
  ['Entertainment', 'season finale reactions'],
  ['Tech', 'new chip benchmark leak'],
  ['Politics', 'budget vote results'],
  ['Weather', 'coastal storm warning'],
  ['Sports', 'transfer window news'],
  ['Business', 'quarterly earnings call'],
  ['Entertainment', 'trailer drops early'],
  ['Tech', 'outage reports spike'],
  ['Science', 'eclipse viewing times'],
  ['Sports', 'match highlights'],
  ['Politics', 'policy announcement'],
  ['Entertainment', 'award show reactions'],
  ['Business', 'ipo pricing news'],
  ['Tech', 'update rollout issues'],
];

const tickerList = document.getElementById('tickerList');
const termStatus = document.getElementById('termStatus');
const MAX_ROWS = 8;
let cursor = 0;

function timeLabel() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function pushRow() {
  const [cat, q] = SAMPLE_QUERIES[cursor % SAMPLE_QUERIES.length];
  cursor += 1;

  const li = document.createElement('li');
  li.innerHTML = `<span class="t">${timeLabel()}</span><span class="cat">${cat}</span><span class="q">${q}</span>`;
  tickerList.prepend(li);

  while (tickerList.children.length > MAX_ROWS) {
    tickerList.removeChild(tickerList.lastElementChild);
  }
}

function startTicker() {
  // Seed a few rows immediately so the terminal isn't empty on load.
  for (let i = 0; i < 4; i++) pushRow();
  setInterval(pushRow, 2200);
}

if (tickerList) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 4; i++) pushRow();
    if (termStatus) termStatus.textContent = 'paused';
  } else {
    startTicker();
  }
}

/* ------------------------------------------------------------
   2. Pricing buttons -> checkout
   Fill these in once you've created Payment Links in your Stripe
   Dashboard (Products -> your plan -> Create payment link). Each
   one is a plain hosted checkout URL — no backend required.
   See README "Wiring up billing" for the full walkthrough.
   ------------------------------------------------------------ */
const CHECKOUT_LINKS = {
  starter: '#',                                  // free plan — point this at your signup page
  pro: 'https://buy.stripe.com/REPLACE_WITH_PRO_LINK',
  business: 'https://buy.stripe.com/REPLACE_WITH_BUSINESS_LINK',
};

document.querySelectorAll('[data-plan]').forEach(btn => {
  const plan = btn.getAttribute('data-plan');
  const url = CHECKOUT_LINKS[plan];
  if (url && url !== '#') {
    btn.setAttribute('href', url);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener');
  } else if (plan === 'starter') {
    btn.addEventListener('click', e => {
      e.preventDefault();
      alert('Wire this button to your signup / account-creation page — see README.md.');
    });
  }
});
