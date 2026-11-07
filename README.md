# Teen Wallet (Parent-Controlled Teen Wallet with Financial Learning)

PayPal AI Hackathon project by team RupeeRanger. A mobile app where a parent adds money (PayPal sandbox) and sets spending rules, and a teen spends, saves and learns inside those rules.

## Folders
| Folder | What is in it |
|---|---|
| `server/` | Node + Express backend API (`src/modules/...`), tests in `server/test` |
| `db/` | `schema.sql`, `seed.sql`, `migrations/` |
| `app/` | Expo (React Native) mobile app (not added yet) |
| `postman/` | Postman collection (no secrets) |
| `docs/` | Architecture and demo script |

## Run the backend on your computer
1. Install Node 18 or newer and PostgreSQL.
2. Create a database: `createdb teenwallet`
3. Load the tables, in this order:
   ```
   psql teenwallet -f db/schema.sql
   psql teenwallet -f db/migrations/002_paypal_orders.sql
   psql teenwallet -f db/seed.sql        # optional demo data
   ```
4. In `server/`: `cp .env.example .env`, then fill in `DATABASE_URL`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`.
5. `npm install`, then `npm run demo-passwords` (only if you loaded seed.sql), then `npm run dev`.
6. Check it: open http://localhost:3000/health. You should see `{"ok":true}`.
7. Run the tests: `npm test` (no database needed).

## Deploy on Render
- Create a PostgreSQL database on Render and run the three SQL files against it.
- Create a Web Service from this repo. Root directory `server`, build command `npm install`, start command `npm start`.
- Add the variables from `.env.example`. Set `DATABASE_SSL=true`, and `PUBLIC_BASE_URL` to your Render address (https).

## API (all under `/api`, JSON, `Authorization: Bearer <token>` except register, login)
| Method and path | Who | What it does |
|---|---|---|
| POST `/auth/register` | anyone | `{name, email, password, role: "parent" or "teen"}`. A teen also gets a wallet and default rules |
| POST `/auth/login` | anyone | `{email, password}` returns `{token, user}` |
| GET `/me` | any | Your profile (a parent also gets their linked teens) |
| POST `/links` | parent | `{teenEmail}` links an existing teen |
| GET `/links` | parent | Lists linked teens |
| GET `/wallet` | any | Balance, spent today, limit, blocked categories. Parent adds `?teenId=` |
| GET `/transactions` | any | Newest first. Optional `?category=food&limit=50&teenId=` |
| POST `/transactions` | teen | `{amountPaise, category, merchant}`. Returns `approved: true/false` and a reason |
| GET / PUT `/rules/:teenId` | parent (PUT), parent or teen (GET) | `{dailyLimitPaise, blockedCategories[]}` |
| POST `/topup/orders` | parent | `{teenId, amountPaise}` creates a PayPal order, returns `approvalUrl` |
| POST `/topup/orders/:orderId/capture` | parent | Takes the money and credits the wallet. Safe to call twice |
| POST `/paypal/webhook` | PayPal | Backup path. Needs `PAYPAL_WEBHOOK_ID` |

Money is always whole paise (100 paise = ₹1). PayPal is charged in USD at `INR_PER_USD`.

## Top-up flow
1. App calls `POST /api/topup/orders`, opens `approvalUrl` in an in-app browser.
2. The parent logs in with a sandbox Personal account and approves.
3. PayPal sends the browser to `PUBLIC_BASE_URL/paypal/return`, which forwards to the app link `APP_DEEP_LINK`.
4. App calls `POST /api/topup/orders/:orderId/capture`. The wallet is credited exactly once.

## Quick check with curl
```
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"teen@example.com","password":"password123"}'
curl localhost:3000/api/wallet -H "Authorization: Bearer <token>"
curl -X POST localhost:3000/api/transactions -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"amountPaise":10000,"category":"food","merchant":"Canteen"}'
```

## Still to build
Goals with Channel3 prices, lessons and quizzes, the AI tutor (Astropods + Elastic), and notifications (push, Zapier). Their folders go under `server/src/modules/`.

## License
MIT. Never commit `.env` or any PayPal secret.
