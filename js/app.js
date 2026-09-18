/* ============================================================
   Expense & Budget Visualizer — app.js
   Optional features implemented:
     1. Custom categories (add / delete)
     2. Dark / light mode toggle
     3. Highlight spending over a set limit
   ============================================================ */

'use strict';

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const STORAGE_KEYS = {
  transactions: 'ebv_transactions',
  categories:   'ebv_categories',
  theme:        'ebv_theme',
  limit:        'ebv_limit',
};

const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Health', 'Education', 'Fun', 'Other'
];

const PALETTE = [
  '#2ecc71', '#3498db', '#e67e22', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#2980b9',
  '#d35400', '#27ae60', '#8e44ad', '#16a085',
];

/* ─── STATE ──────────────────────────────────────────────────── */
let transactions  = [];
let categories    = [];
let spendingLimit = 0;
let currentMonth  = new Date();

/* ─── LOCALSTORAGE HELPERS ───────────────────────────────────── */
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.error('localStorage save failed:', e); }
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

/* ─── INIT ───────────────────────────────────────────────────── */
function init() {
  transactions  = load(STORAGE_KEYS.transactions, []);
  categories    = load(STORAGE_KEYS.categories,   DEFAULT_CATEGORIES);
  spendingLimit = load(STORAGE_KEYS.limit, 0);

  if (!categories.length) categories = [...DEFAULT_CATEGORIES];

  applyTheme(load(STORAGE_KEYS.theme, 'light'));
  populateCategorySelect();
  renderCategoryManager();
  renderLimitSection();
  renderAll();
  bindEvents();
}

/* ─── THEME  (Optional Feature 2) ───────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
  save(STORAGE_KEYS.theme, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ─── CATEGORIES  (Optional Feature 1) ──────────────────────── */
function getCategoryColor(name) {
  const idx = categories.indexOf(name);
  return idx >= 0 ? PALETTE[idx % PALETTE.length] : '#aaaaaa';
}

function populateCategorySelect() {
  const sel     = document.getElementById('category');
  const current = sel.value;
  sel.innerHTML = '';

  categories.forEach(cat => {
    const opt    = document.createElement('option');
    opt.value    = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });

  const customOpt = document.createElement('option');
  customOpt.value       = '__custom__';
  customOpt.textContent = '+ Add custom category…';
  sel.appendChild(customOpt);

  if (current && [...sel.options].some(o => o.value === current)) {
    sel.value = current;
  }
}

function renderCategoryManager() {
  const list = document.getElementById('catList');
  list.innerHTML = '';

  categories.forEach((cat, i) => {
    const li  = document.createElement('li');
    li.className = 'cat-item';

    const dot = document.createElement('span');
    dot.className      = 'cat-dot';
    dot.style.background = PALETTE[i % PALETTE.length];

    const label = document.createElement('span');
    label.textContent = cat;

    const del = document.createElement('button');
    del.className = 'cat-delete';
    del.setAttribute('aria-label', `Delete category ${cat}`);
    del.textContent = '×';
    del.addEventListener('click', () => deleteCategory(cat));

    li.appendChild(dot);
    li.appendChild(label);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return showCatError('Category name cannot be empty.');
  if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    return showCatError('Category already exists.');
  }
  categories.push(trimmed);
  save(STORAGE_KEYS.categories, categories);
  populateCategorySelect();
  renderCategoryManager();
  document.getElementById('newCatInput').value = '';
}

function deleteCategory(name) {
  if (transactions.some(t => t.category === name)) {
    alert(`Cannot delete "${name}" — it is used by existing transactions.`);
    return;
  }
  categories = categories.filter(c => c !== name);
  if (!categories.length) categories = ['Other'];
  save(STORAGE_KEYS.categories, categories);
  populateCategorySelect();
  renderCategoryManager();
}

function showCatError(msg) {
  const input = document.getElementById('newCatInput');
  input.style.borderColor = 'var(--danger)';
  input.title = msg;
  setTimeout(() => { input.style.borderColor = ''; input.title = ''; }, 2000);
}

/* ─── SPENDING LIMIT  (Optional Feature 3) ──────────────────── */
function renderLimitSection() {
  const display = document.getElementById('limitDisplay');
  const info    = document.getElementById('limitInfo');
  const bar     = document.getElementById('limitBar');

  if (!spendingLimit || spendingLimit <= 0) {
    display.classList.add('hidden');
    return;
  }

  const now = new Date();
  const monthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense'
        && d.getFullYear() === now.getFullYear()
        && d.getMonth()    === now.getMonth();
    })
    .reduce((s, t) => s + t.amount, 0);

  const pct = Math.min((monthExpenses / spendingLimit) * 100, 100);

  bar.style.width = pct + '%';
  bar.className   = 'limit-bar';
  if (pct >= 100)     bar.classList.add('over');
  else if (pct >= 75) bar.classList.add('warn');

  info.textContent =
    `$${monthExpenses.toFixed(2)} spent of $${spendingLimit.toFixed(2)} limit (${pct.toFixed(0)}%)`;

  let alertEl = document.getElementById('limitAlert');
  if (pct >= 100) {
    if (!alertEl) {
      alertEl = document.createElement('p');
      alertEl.id        = 'limitAlert';
      alertEl.className = 'limit-alert';
      display.appendChild(alertEl);
    }
    alertEl.textContent = '⚠️ You have exceeded your monthly spending limit!';
  } else if (pct >= 75) {
    if (!alertEl) {
      alertEl = document.createElement('p');
      alertEl.id        = 'limitAlert';
      alertEl.className = 'limit-alert';
      display.appendChild(alertEl);
    }
    alertEl.textContent = '⚠️ You are approaching your monthly spending limit.';
  } else {
    alertEl && alertEl.remove();
  }

  display.classList.remove('hidden');
}

/* ─── TRANSACTIONS CRUD ──────────────────────────────────────── */
function addTransaction(name, amount, type, category) {
  const tx = {
    id:       Date.now().toString(),
    name:     name.trim(),
    amount:   parseFloat(amount),
    type,
    category,
    date:     new Date().toISOString(),
  };
  transactions.unshift(tx);
  save(STORAGE_KEYS.transactions, transactions);
  renderAll();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save(STORAGE_KEYS.transactions, transactions);
  renderAll();
}

/* ─── BALANCE ────────────────────────────────────────────────── */
function renderBalance() {
  const income  = transactions.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const balEl = document.getElementById('totalBalance');
  balEl.classList.remove('updated');
  void balEl.offsetWidth;
  balEl.classList.add('updated');

  balEl.textContent = formatCurrency(balance);
  balEl.classList.toggle('negative', balance < 0);

  document.getElementById('totalIncome') .textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
}

/* ─── TRANSACTION LIST ───────────────────────────────────────── */
function getSortedTransactions() {
  const sort = document.getElementById('sortSelect').value;
  const copy = [...transactions];
  switch (sort) {
    case 'date-asc':    return copy.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'amount-desc': return copy.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':  return copy.sort((a, b) => a.amount - b.amount);
    case 'category':    return copy.sort((a, b) => a.category.localeCompare(b.category));
    default:            return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function renderTransactions() {
  const list   = document.getElementById('transactionList');
  const sorted = getSortedTransactions();

  if (!sorted.length) {
    list.innerHTML = '<li class="empty-state">No transactions yet. Add one above!</li>';
    return;
  }

  const now = new Date();
  const monthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense'
        && d.getFullYear() === now.getFullYear()
        && d.getMonth()    === now.getMonth();
    })
    .reduce((s, t) => s + t.amount, 0);
  const overLimit = spendingLimit > 0 && monthExpenses > spendingLimit;

  list.innerHTML = '';
  sorted.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'tx-item';

    if (overLimit && tx.type === 'expense') {
      const d = new Date(tx.date);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        li.classList.add('over-limit');
      }
    }

    const sign    = tx.type === 'income' ? '+' : '-';
    const dateStr = formatDate(tx.date);
    const color   = getCategoryColor(tx.category);

    li.innerHTML = `
      <div class="tx-info">
        <p class="tx-name">${escapeHtml(tx.name)}</p>
        <p class="tx-amount ${tx.type}">${sign}${formatCurrency(tx.amount)}</p>
        <div class="tx-meta">
          <span class="tx-badge" style="border-left:3px solid ${color}">
            ${escapeHtml(tx.category)}
          </span>
          <span class="tx-date">${dateStr}</span>
        </div>
      </div>
      <button class="btn btn-danger" aria-label="Delete ${escapeHtml(tx.name)}">Delete</button>`;

    li.querySelector('.btn-danger').addEventListener('click', () => deleteTransaction(tx.id));
    list.appendChild(li);
  });
}

/* ─── PIE CHART (Canvas) ─────────────────────────────────────── */
function renderChart() {
  const canvas = document.getElementById('spendingChart');
  const ctx    = canvas.getContext('2d');
  const legend = document.getElementById('chartLegend');
  const empty  = document.getElementById('emptyChart');

  const data = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => { data[t.category] = (data[t.category] || 0) + t.amount; });

  const entries = Object.entries(data).filter(([, v]) => v > 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  legend.innerHTML = '';

  if (!entries.length) {
    empty.classList.remove('hidden');
    canvas.style.display = 'none';
    return;
  }

  empty.classList.add('hidden');
  canvas.style.display = '';

  const total      = entries.reduce((s, [, v]) => s + v, 0);
  const cx         = canvas.width  / 2;
  const cy         = canvas.height / 2;
  const radius     = Math.min(cx, cy) - 8;
  let   startAngle = -Math.PI / 2;

  entries.forEach(([cat, val]) => {
    const slice = (val / total) * 2 * Math.PI;
    const color = getCategoryColor(cat);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    startAngle += slice;

    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background:${color}"></span>
      <span>${escapeHtml(cat)} (${((val / total) * 100).toFixed(1)}%)</span>`;
    legend.appendChild(item);
  });
}

/* ─── MONTHLY SUMMARY ────────────────────────────────────────── */
function renderMonthlySummary() {
  const label   = document.getElementById('currentMonthLabel');
  const content = document.getElementById('summaryContent');

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  label.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1));

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (!monthTx.length) {
    content.innerHTML = '<p class="empty-state">No data for this month.</p>';
    return;
  }

  const catData = {};
  monthTx.forEach(t => {
    if (!catData[t.category]) catData[t.category] = { income: 0, expense: 0 };
    catData[t.category][t.type] += t.amount;
  });

  let totalIncome = 0, totalExpense = 0;

  const rows = Object.entries(catData).map(([cat, d]) => {
    totalIncome  += d.income;
    totalExpense += d.expense;
    const net   = d.income - d.expense;
    const color = getCategoryColor(cat);
    return `<tr>
      <td>
        <span style="display:inline-flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
          ${escapeHtml(cat)}
        </span>
      </td>
      <td class="col-income">${d.income  > 0 ? formatCurrency(d.income)  : '—'}</td>
      <td class="col-expense">${d.expense > 0 ? formatCurrency(d.expense) : '—'}</td>
      <td class="col-net ${net >= 0 ? 'positive' : 'negative'}">${formatCurrency(net)}</td>
    </tr>`;
  }).join('');

  const netTotal = totalIncome - totalExpense;

  content.innerHTML = `
    <table class="summary-table" role="table">
      <thead>
        <tr>
          <th>Category</th><th>Income</th><th>Expense</th><th>Net</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary-totals">
      <div class="summary-total-item income">
        <div class="stl">Total Income</div>
        <div class="stv">${formatCurrency(totalIncome)}</div>
      </div>
      <div class="summary-total-item expense">
        <div class="stl">Total Expense</div>
        <div class="stv">${formatCurrency(totalExpense)}</div>
      </div>
      <div class="summary-total-item net">
        <div class="stl">Net</div>
        <div class="stv" style="color:${netTotal >= 0 ? 'var(--income-color)' : 'var(--expense-color)'}">
          ${formatCurrency(netTotal)}
        </div>
      </div>
    </div>`;
}

/* ─── RENDER ALL ─────────────────────────────────────────────── */
function renderAll() {
  renderBalance();
  renderTransactions();
  renderChart();
  renderMonthlySummary();
  renderLimitSection();
}

/* ─── EVENT BINDINGS ─────────────────────────────────────────── */
function bindEvents() {
  // Dark/light toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Add transaction
  document.getElementById('transactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const name   = document.getElementById('itemName').value.trim();
    const amount = document.getElementById('amount').value;
    const type   = document.getElementById('txType').value;
    let category = document.getElementById('category').value;
    const errEl  = document.getElementById('formError');

    if (category === '__custom__') {
      const customVal = document.getElementById('customCategory').value.trim();
      if (!customVal) { showError(errEl, 'Please enter a custom category name.'); return; }
      if (!categories.map(c => c.toLowerCase()).includes(customVal.toLowerCase())) {
        categories.push(customVal);
        save(STORAGE_KEYS.categories, categories);
        populateCategorySelect();
        renderCategoryManager();
      }
      category = customVal;
    }

    if (!name) { showError(errEl, 'Item name cannot be empty.'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showError(errEl, 'Please enter a valid positive amount.'); return;
    }

    errEl.classList.add('hidden');
    addTransaction(name, amount, type, category);
    document.getElementById('transactionForm').reset();
    document.getElementById('customCategoryWrap').style.display = 'none';
    populateCategorySelect();
  });

  // Show/hide custom category field
  document.getElementById('category').addEventListener('change', function () {
    const wrap = document.getElementById('customCategoryWrap');
    if (this.value === '__custom__') {
      wrap.style.display        = 'flex';
      wrap.style.flexDirection  = 'column';
      document.getElementById('customCategory').focus();
    } else {
      wrap.style.display = 'none';
    }
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', renderTransactions);

  // Category manager toggle
  document.getElementById('toggleCatManager').addEventListener('click', () => {
    const wrap = document.getElementById('catManagerWrap');
    wrap.classList.toggle('hidden');
    document.getElementById('toggleCatManager').textContent =
      wrap.classList.contains('hidden') ? 'Manage' : 'Close';
  });

  document.getElementById('addCatBtn').addEventListener('click', () => {
    addCategory(document.getElementById('newCatInput').value);
  });

  document.getElementById('newCatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCategory(document.getElementById('newCatInput').value); }
  });

  // Spending limit
  document.getElementById('toggleLimitForm').addEventListener('click', () => {
    const wrap = document.getElementById('limitFormWrap');
    wrap.classList.toggle('hidden');
    if (!wrap.classList.contains('hidden')) {
      document.getElementById('limitInput').value = spendingLimit > 0 ? spendingLimit : '';
      document.getElementById('limitInput').focus();
    }
  });

  document.getElementById('saveLimitBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('limitInput').value);
    if (isNaN(val) || val < 0) {
      const inp = document.getElementById('limitInput');
      inp.style.borderColor = 'var(--danger)';
      setTimeout(() => { inp.style.borderColor = ''; }, 1500);
      return;
    }
    spendingLimit = val;
    save(STORAGE_KEYS.limit, spendingLimit);
    document.getElementById('limitFormWrap').classList.add('hidden');
    renderLimitSection();
    renderTransactions();
  });

  // Monthly navigation
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderMonthlySummary();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderMonthlySummary();
  });
}

/* ─── UTILITIES ──────────────────────────────────────────────── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(isoString));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

/* ─── BOOT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
