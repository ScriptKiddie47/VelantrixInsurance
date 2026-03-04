/* ============================================================
   VELANTRIX INSURANCE — script.js
   ============================================================ */

'use strict';

/* ---- Navbar scroll shadow ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ---- Mobile hamburger menu ---- */
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close menu when a nav link is clicked
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  });
});

/* ---- Scroll-fade animations (IntersectionObserver) ---- */
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach(el => observer.observe(el));

/* ---- Billing toggle (Monthly / Annual) ---- */
const billingToggle   = document.getElementById('billing-toggle');
const priceAmounts    = document.querySelectorAll('.price-amount');
const labelMonthly    = document.getElementById('label-monthly');
const labelAnnual     = document.getElementById('label-annual');
const annualNotes     = document.querySelectorAll('.price-annual-note');

billingToggle.addEventListener('change', () => {
  const isAnnual = billingToggle.checked;

  priceAmounts.forEach(el => {
    el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
  });

  annualNotes.forEach(note => {
    note.style.display = isAnnual ? 'block' : 'none';
  });

  labelMonthly.classList.toggle('active', !isAnnual);
  labelAnnual.classList.toggle('active', isAnnual);
});

// Set initial active label
labelMonthly.classList.add('active');

/* ---- Card-number formatting (groups of 4) ---- */
const cardNumberInput = document.getElementById('card-number');
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
  });
}

/* ---- Expiry auto-slash ---- */
const cardExpiry = document.getElementById('card-expiry');
if (cardExpiry) {
  cardExpiry.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    e.target.value = val;
  });
}

/* ---- Form helpers ---- */
function setError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(errorId);
  if (!input || !errEl) return;
  if (message) {
    input.classList.add('error');
    errEl.textContent = message;
  } else {
    input.classList.remove('error');
    errEl.textContent = '';
  }
}

function clearErrors(fields) {
  fields.forEach(([inputId, errorId]) => setError(inputId, errorId, ''));
}

function isValidCardNumber(num) {
  return num.replace(/\s/g, '').length === 16;
}

function isValidExpiry(val) {
  if (!/^\d{2}\/\d{2}$/.test(val)) return false;
  const [mm, yy] = val.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const expDate = new Date(2000 + yy, mm - 1, 1);
  return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

/* ---- Payment form ---- */
const paymentForm    = document.getElementById('payment-form');
const paymentSuccess = document.getElementById('payment-success');

if (paymentForm) {
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      ['cardholder-name', 'err-name'],
      ['company-name',    'err-company'],
      ['card-number',     'err-card'],
      ['card-expiry',     'err-expiry'],
      ['card-cvv',        'err-cvv'],
      ['billing-address', 'err-address'],
    ];
    clearErrors(fields);

    const name    = document.getElementById('cardholder-name').value.trim();
    const company = document.getElementById('company-name').value.trim();
    const card    = document.getElementById('card-number').value.trim();
    const expiry  = document.getElementById('card-expiry').value.trim();
    const cvv     = document.getElementById('card-cvv').value.trim();
    const address = document.getElementById('billing-address').value.trim();

    if (!name) {
      setError('cardholder-name', 'err-name', 'Cardholder name is required.');
      valid = false;
    }
    if (!company) {
      setError('company-name', 'err-company', 'Company name is required.');
      valid = false;
    }
    if (!card || !isValidCardNumber(card)) {
      setError('card-number', 'err-card', 'Please enter a valid 16-digit card number.');
      valid = false;
    }
    if (!expiry || !isValidExpiry(expiry)) {
      setError('card-expiry', 'err-expiry', 'Enter a valid expiry date (MM/YY).');
      valid = false;
    }
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      setError('card-cvv', 'err-cvv', 'Enter a valid 3–4 digit CVV.');
      valid = false;
    }
    if (!address) {
      setError('billing-address', 'err-address', 'Billing address is required.');
      valid = false;
    }

    if (valid) {
      paymentForm.style.display = 'none';
      paymentSuccess.style.display = 'flex';
      showToast('Payment submitted successfully!');
    } else {
      // Scroll to first error
      const firstError = paymentForm.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/* ---- Claims form ---- */
const claimsForm    = document.getElementById('claims-form');
const claimsSuccess = document.getElementById('claims-success');
const claimIdSpan   = document.getElementById('claim-id');

if (claimsForm) {
  // Set max date for incident-date to today
  const incidentDateInput = document.getElementById('incident-date');
  if (incidentDateInput) {
    incidentDateInput.max = new Date().toISOString().split('T')[0];
  }

  // File upload display
  const fileInput = document.getElementById('evidence-upload');
  const fileDisplay = document.getElementById('file-name-display');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length === 0) {
        fileDisplay.textContent = 'Click to upload photos or PDF documents';
      } else if (fileInput.files.length === 1) {
        fileDisplay.textContent = fileInput.files[0].name;
      } else {
        fileDisplay.textContent = `${fileInput.files.length} files selected`;
      }
    });
  }

  claimsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      ['policy-number', 'err-policy'],
      ['incident-date', 'err-date'],
      ['incident-type', 'err-type'],
      ['incident-desc', 'err-desc'],
    ];
    clearErrors(fields);

    const policy = document.getElementById('policy-number').value.trim();
    const date   = document.getElementById('incident-date').value;
    const type   = document.getElementById('incident-type').value;
    const desc   = document.getElementById('incident-desc').value.trim();

    if (!policy) {
      setError('policy-number', 'err-policy', 'Policy number is required.');
      valid = false;
    }
    if (!date) {
      setError('incident-date', 'err-date', 'Please select the incident date.');
      valid = false;
    }
    if (!type) {
      setError('incident-type', 'err-type', 'Please select the incident type.');
      valid = false;
    }
    if (!desc || desc.length < 20) {
      setError('incident-desc', 'err-desc', 'Please provide a description (at least 20 characters).');
      valid = false;
    }

    if (valid) {
      // Generate a dummy claim ID
      const claimId = Math.floor(100000 + Math.random() * 900000);
      if (claimIdSpan) claimIdSpan.textContent = claimId;

      claimsForm.style.display = 'none';
      claimsSuccess.style.display = 'flex';
      showToast('Claim #VEL-' + claimId + ' submitted!');
    } else {
      const firstError = claimsForm.querySelector('.error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/* ---- Toast notification ---- */
function showToast(message, duration = 4000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ============================================================
   MULTI-PAGE QUOTE FLOW UTILITIES
   ============================================================ */

/* ---- Session storage helpers ---- */
function getQuoteData() {
  try { return JSON.parse(sessionStorage.getItem('velantrix_quote') || '{}'); }
  catch { return {}; }
}

function saveQuoteData(fields) {
  const existing = getQuoteData();
  sessionStorage.setItem('velantrix_quote', JSON.stringify({ ...existing, ...fields }));
}

/* ---- Pre-fill form inputs from sessionStorage ---- */
function loadStep(fieldIds) {
  const data = getQuoteData();
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el || data[id] === undefined) return;
    if (el.type === 'radio' || el.type === 'checkbox') {
      // handled separately per page
    } else {
      el.value = data[id];
    }
  });
}

/* ---- Validate a list of rules, return true if all pass ---- */
function validateStep(rules) {
  let valid = true;
  rules.forEach(({ id, errId, test, msg }) => {
    const el = document.getElementById(id);
    const val = el ? el.value.trim() : '';
    if (!test(val, el)) {
      setError(id, errId, msg);
      valid = false;
    } else {
      setError(id, errId, '');
    }
  });
  return valid;
}

/* ---- Premium calculation (deterministic dummy) ---- */
function calculatePremium(data) {
  const lines = [];
  let total = 0;

  const BASE = 30; // base admin fee
  total += BASE;

  const coveragePrices = {
    liability_bi:  { label: 'Liability (Bodily Injury)',   base: 28 },
    liability_pd:  { label: 'Liability (Property Damage)', base: 18 },
    collision:     { label: 'Collision Coverage',          base: 35 },
    comprehensive: { label: 'Comprehensive Coverage',      base: 22 },
    uninsured:     { label: 'Uninsured Motorist',          base: 15 },
    medical:       { label: 'Medical Payments / PIP',      base: 12 },
  };

  Object.entries(coveragePrices).forEach(([key, info]) => {
    if (data[key] === 'on' || data[key] === true || data[key] === 'true') {
      lines.push({ label: info.label, amount: info.base });
      total += info.base;
    }
  });

  // Add-ons
  const addons = [
    { key: 'addon_roadside', label: 'Roadside Assistance', amount: 5 },
    { key: 'addon_rental',   label: 'Rental Reimbursement', amount: 8 },
    { key: 'addon_gap',      label: 'Gap Coverage',         amount: 10 },
  ];
  addons.forEach(a => {
    if (data[a.key] === 'on' || data[a.key] === true || data[a.key] === 'true') {
      lines.push({ label: a.label, amount: a.amount });
      total += a.amount;
    }
  });

  // Mileage factor
  const mileage = data.annual_mileage || '';
  if (mileage.includes('15,000') || mileage.includes('20,000') || mileage.includes('25,000')) {
    total = Math.round(total * 1.15);
  }

  return { lines, total, base: BASE };
}

/* ---- Generate policy number ---- */
function generatePolicyNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `VEL-${year}-${rand}`;
}

/* ---- Populate step 4 policy summary ---- */
function renderPolicySummary() {
  const data = getQuoteData();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };

  set('summary-name',    data.full_name);
  set('summary-dob',     data.dob);
  set('summary-email',   data.email);
  set('summary-vehicle', [data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(' ') || '—');
  set('summary-plate',   data.license_plate);
  set('summary-use',     data.primary_use);

  // Effective / expiry dates
  const today = new Date();
  const expiry = new Date(today);
  expiry.setFullYear(today.getFullYear() + 1);
  const fmt = d => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  set('summary-effective', fmt(today));
  set('summary-expiry',    fmt(expiry));

  // Premium
  const premium = calculatePremium(data);
  set('summary-premium', `$${premium.total}/mo`);

  // Policy number
  const policyNum = data.policy_number || generatePolicyNumber();
  if (!data.policy_number) saveQuoteData({ policy_number: policyNum });
  const pnEl = document.getElementById('summary-policy-number');
  if (pnEl) pnEl.textContent = policyNum;

  // Active coverages tags
  const coverageLabels = {
    liability_bi:  'Liability BI',
    liability_pd:  'Liability PD',
    collision:     'Collision',
    comprehensive: 'Comprehensive',
    uninsured:     'Uninsured Motorist',
    medical:       'Med Pay / PIP',
    addon_roadside:'Roadside Assist',
    addon_rental:  'Rental Reimb.',
    addon_gap:     'Gap Coverage',
  };
  const tagsEl = document.getElementById('summary-coverages');
  if (tagsEl) {
    tagsEl.innerHTML = '';
    Object.entries(coverageLabels).forEach(([key, label]) => {
      if (data[key] === 'on' || data[key] === true || data[key] === 'true') {
        const tag = document.createElement('span');
        tag.className = 'coverage-tag';
        tag.textContent = label;
        tagsEl.appendChild(tag);
      }
    });
  }
}

/* ---- Download policy summary as text ---- */
function downloadPolicySummary() {
  const data = getQuoteData();
  const vehicle = [data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(' ');
  const today = new Date();
  const expiry = new Date(today); expiry.setFullYear(today.getFullYear() + 1);
  const fmt = d => d.toLocaleDateString('en-US');
  const premium = calculatePremium(data);

  const text = [
    'VELANTRIX INSURANCE — POLICY SUMMARY',
    '======================================',
    '',
    `Policy Number  : ${data.policy_number || '—'}`,
    `Policyholder   : ${data.full_name || '—'}`,
    `Date of Birth  : ${data.dob || '—'}`,
    `Email          : ${data.email || '—'}`,
    `Phone          : ${data.phone || '—'}`,
    '',
    `Vehicle        : ${vehicle || '—'}`,
    `License Plate  : ${data.license_plate || '—'}`,
    `Primary Use    : ${data.primary_use || '—'}`,
    '',
    `Effective Date : ${fmt(today)}`,
    `Expiry Date    : ${fmt(expiry)}`,
    '',
    `Monthly Premium: $${premium.total}`,
    '',
    '* This is a demo document. Not a real insurance policy.',
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Velantrix-Policy-${data.policy_number || 'Summary'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
