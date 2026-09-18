# Expense & Budget Visualizer

A mobile-friendly web app for tracking daily spending. Built with pure HTML, CSS, and Vanilla JavaScript — no frameworks, no backend.

## Live Demo

> Deploy via GitHub Pages and paste the link here.

## Features

### Core
- **Total Balance** — real-time income minus expenses
- **Add Transactions** — item name, amount, type (income / expense), category
- **Transaction History** — full list with per-item delete
- **Spending by Category** — pie chart via HTML5 Canvas (no library)
- **Local Storage** — all data persists client-side across reloads

### Optional Challenges (3 of 5)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Custom Categories** | Add or delete categories from the Categories panel |
| 2 | **Dark / Light Mode** | Header toggle button; preference saved to localStorage |
| 3 | **Spending Limit Highlight** | Set a monthly budget; progress bar turns orange at 75%, red at 100%; over-limit expense rows are highlighted with ⚠️ |

### Bonus
- **Monthly Summary** — navigate months with ‹/› arrows; breakdown by category
- **Sort Transactions** — by newest, oldest, amount high/low, or category

## Project Structure

```
├── index.html        ← app shell & markup
├── css/
│   └── style.css     ← all styles (1 file)
├── js/
│   └── app.js        ← all logic (1 file, no dependencies)
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, flexbox, grid) |
| Logic | Vanilla JavaScript ES2020 |
| Storage | Browser `localStorage` |
| Chart | HTML5 `<canvas>` drawn manually |

## Running Locally

Open `index.html` in any modern browser. No build step required.

## GitHub Pages Deployment

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Source: `main` branch, root `/`
4. Your site will be live at `https://<username>.github.io/<repo>/`

---
*CodingCamp — September 19, 2026 — Kenneth Jonathan*
