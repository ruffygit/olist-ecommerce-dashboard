# Olist E-Commerce Performance

A responsive, single-page dashboard for Olist sales, delivery, reviews and payment performance. Data is served live by seven read-only Supabase views and visualized with Recharts.

## Architecture

- React and Vite provide the browser application.
- `@supabase/supabase-js` reads only `v_dash_*` views through the public Supabase API.
- Recharts renders the monthly, category, state, delivery, review and payment charts.
- The database views aggregate the qualifying Olist data for 2017-01-01 through 2018-08-31.

Codex uses the Supabase MCP connection during development for schema inspection, SQL validation, migration and database checks. The browser application does not use MCP. It uses `supabase-js` with a public anon or publishable key. It contains no SQL and no service-role credential.

## Supabase setup

The dashboard views have been created in project `jkacjxzeuqjpezqpzlgy` by the `olist_dashboard_views` migration. The migration grants `SELECT` on those views to `anon`; it does not grant base-table access or disable RLS. Only the aggregated dashboard views are queried by this application.

The frontend needs the project URL and a public anon/publishable key. Configure the project’s API access policies and review the views’ public exposure before deployment; anything granted to `anon` is publicly readable.

## Environment variables

Copy `.env.example` to `.env`, then set:

```dotenv
VITE_SUPABASE_URL=https://jkacjxzeuqjpezqpzlgy.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

`.env` is ignored by Git. Never use a `service_role` key in a browser build. Missing configuration is shown in the dashboard instead of being replaced with sample data.

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Configure `.env` before expecting live data.

## npm commands

- `npm run dev` starts the Vite development server.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.

## Database views

- `v_dash_kpis` — revenue, qualifying orders, average order value, on-time rate, average review and repeat-customer rate.
- `v_dash_monthly` — monthly revenue and qualifying order count.
- `v_dash_top_categories` — ten leading categories plus an `Other` remainder so displayed category revenue reconciles to total revenue.
- `v_dash_revenue_by_state` — ten leading customer states by revenue.
- `v_dash_delivery_monthly` — average delivered days and on-time rate by purchase month.
- `v_dash_review_by_delay` — average review and order count for five delivery-delay buckets.
- `v_dash_payment_mix` — payment value, share and average installments.

## Security model

The browser uses only the public key and reads only the named aggregate views. No base-table grants were added, and RLS was not disabled. The views are intentionally selectable by `anon`, so their returned aggregates are public. Keep privileged credentials on trusted servers only.

MCP is used by Codex during development and is not bundled into, or called by, the browser application.

## Vercel deployment

1. Import this repository into Vercel and set the project root to `olist-dashboard` if deploying from a monorepo.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project’s Environment Variables for the required deployment environments.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy and open the generated URL. Verify that the seven view requests succeed in the browser network panel.

Vite embeds `VITE_` values in the public browser bundle; only public Supabase credentials belong there.
