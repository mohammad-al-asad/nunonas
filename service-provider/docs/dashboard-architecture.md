# Dashboard architecture and performance standard

This dashboard follows the same ownership model used by production SaaS applications:

| State | Owner | Examples |
| --- | --- | --- |
| Remote/server state | TanStack Query | bookings, reviews, promotions, inventory, analytics |
| Shareable navigation state | URL search parameters | page, search, date range, status filters |
| Editable form drafts | component form state | room editor, loyalty rules, settings |
| Ephemeral UI state | local component/context | open dialog, active tab, mobile sidebar |

Do not copy API responses into component state. Query cache entries must be keyed by every parameter that can change the response. Query functions receive TanStack Query's `AbortSignal`; mutations that affect visible lists use cancel → snapshot → optimistic update → rollback → invalidate.

## Refresh and consistency policy

- Dashboard overview and upcoming bookings refresh every 60 seconds.
- Notifications refresh every 30 seconds.
- Window focus and network reconnect revalidate stale data.
- Profile data is fresh for five minutes; analytics is fresh for one minute and keyed by its date range.
- Mutations invalidate the smallest domain key instead of reloading the page.
- WebSocket infrastructure is not used until endpoints can authenticate connections and isolate vendor rooms. Polling is the safe live-update fallback.

## Latency budgets

| Operation | Target p95 |
| --- | ---: |
| Cached dashboard navigation | 100 ms |
| API read | 500 ms |
| Dashboard aggregate | 800 ms |
| API write | 1,000 ms |
| Image upload/export | 3,000 ms |

The browser cancels abandoned reads and reports a friendly timeout after 15 seconds. Writes time out after 30 seconds. The Next.js proxy and FastAPI responses propagate `Server-Timing` and `X-Request-ID` so slow spans can be correlated. Core Web Vitals are reported to `/api/telemetry/web-vitals`.

## Backend query rules

- Never create, inspect, or drop indexes in a request-scoped repository.
- Install indexes once with `python scripts/ensure_vendor_indexes.py` during deployment.
- Restrict projections and date windows for dashboard aggregates; never load a vendor's full history to compute a current KPI.
- Occupancy is a date-specific metric, not the count of every active booking ever created.
- Do not return invented analytics. Mark unavailable demographic data as unavailable and return zero-valued distributions.
- Do not expose exception messages, upstream URLs, tokens, or cookies to clients.

## Release checklist

Run these gates before deployment:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Backend deployment must run:

```bash
pip install -r requirements.txt
python scripts/ensure_vendor_indexes.py
pytest -q
```

The included GitHub Actions workflows enforce the build, test, type, and production dependency audit gates.
