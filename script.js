/* ============================================================
   KeywordCatch — site script
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
  ['People', 'Leon Schuster'],
  ['Politics', 'Andile Lungisa'],
  ['Health', 'hair loss'],
  ['Politics', 'Andile Lungisa'],
  ['Local', 'slade thomas durban'],
  ['Books', 'the early spring novel ending'],
  ['Sports', 'Jody February'],
  ['People', 'Leon Schuster South African filmmaker'],
  ['Politics', 'Andile Lungisa ANC Youth League'],
  ['Health', 'hair loss'],
  ['Local', 'slade thomas durban'],
  ['Books', 'the early spring novel ending'],
  ['Sports', 'Jody February South African soccer player'],
  ['People', 'Leon Schuster South African filmmaker'],
  ['Politics', 'Andile Lungisa'],
];

const tickerList = document.getElementById('tickerList');
const termStatus = document.getElementById('termStatus');
const MAX_ROWS = 8;
let cursor = 0;

function timeLabel() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function updatePositions() {
  Array.from(tickerList.children).forEach((item, index) => {
    const pos = item.querySelector('.pos');
    const trend = item.querySelector('.trend');
    const direction = item.dataset.direction || (index < 4 ? 'up' : 'down');

    if (pos) pos.textContent = `#${index + 1}`;
    if (trend) {
      trend.textContent = direction === 'up' ? '↑' : '↓';
      trend.classList.toggle('trend-up', direction === 'up');
      trend.classList.toggle('trend-down', direction === 'down');
      trend.setAttribute('aria-label', `moving ${direction}`);
    }

    item.classList.toggle('trend-up-row', direction === 'up');
    item.classList.toggle('trend-down-row', direction === 'down');
    item.dataset.direction = direction;
  });
}

function pushRow() {
  const [cat, q] = SAMPLE_QUERIES[cursor % SAMPLE_QUERIES.length];
  cursor += 1;

  const direction = (cursor + 1) % 3 === 0 || (cursor + 1) % 5 === 0 ? 'up' : 'down';

  const li = document.createElement('li');
  li.dataset.direction = direction;
  li.innerHTML = `
    <span class="word-bar"></span>
    <span class="pos">#1</span>
    <span class="trend ${direction === 'up' ? 'trend-up' : 'trend-down'}" aria-label="moving ${direction}">${direction === 'up' ? '↑' : '↓'}</span>
    <span class="t">${timeLabel()}</span>
    <span class="cat">${cat}</span>
    <span class="q">${q}</span>
  `;
  tickerList.prepend(li);

  while (tickerList.children.length > MAX_ROWS) {
    tickerList.removeChild(tickerList.lastElementChild);
  }

  updatePositions();
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
   2. Contact form
   Country is detected from the visitor's IP, with the select kept
   available as a fallback when the lookup cannot identify them.
   ------------------------------------------------------------ */
const contactForm = document.getElementById('contactForm');
const countrySelect = document.getElementById('country');
const countryStatus = document.getElementById('countryStatus');
const formStatus = document.getElementById('formStatus');

if (countrySelect) {
  fetch('https://ipapi.co/json/')
    .then(response => {
      if (!response.ok) throw new Error('Country lookup failed');
      return response.json();
    })
    .then(location => {
      const detectedCountry = Array.from(countrySelect.options)
        .find(option => option.textContent === location.country_name);
      countrySelect.value = detectedCountry ? detectedCountry.value : 'Other';
      if (countryStatus) countryStatus.textContent = detectedCountry
        ? 'Country detected automatically. You can change it if needed.'
        : 'Country detected, but it is not in the list. Please choose an option.';
    })
    .catch(() => {
      if (countryStatus) countryStatus.textContent = 'We could not detect your country. Please choose one.';
    });
}

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);
    const planDetails = {
      starter: 'Starter ($25, RSA monitoring, 15-minute sync, 1 team seat)',
      pro: 'Pro ($49/month, RSA monitoring, 1-second sync, 1 webhook, 2 team seats)',
      business: 'Business ($99/month, RSA+ monitoring, 1-second sync, unlimited webhooks and seats)',
    };
    const linkedPlan = new URLSearchParams(window.location.search).get('plan');

    if (planDetails[linkedPlan]) {
      formData.append('Pricing context', planDetails[linkedPlan]);
    }

    const turnstileToken = formData.get('cf-turnstile-response');
    if (typeof turnstileToken !== 'string' || turnstileToken.length === 0) {
      if (formStatus) formStatus.textContent = 'Please complete the security check before sending.';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    })
      .then(response => {
        if (!response.ok) throw new Error('Message could not be sent');
        contactForm.reset();
        if (formStatus) formStatus.textContent = 'Thanks. Your message has been sent.';
      })
      .catch(() => {
        if (formStatus) formStatus.textContent = 'We could not send the message. Please try again.';
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Send message';
        if (window.turnstile) window.turnstile.reset();
      });
  });
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
