# Teen Wallet (Parent-Controlled Teen Wallet with Financial Learning)

PayPal AI Hackathon project by team RupeeRanger. A mobile app where a parent adds money with **PayPal (sandbox)** and sets spending rules, and a teen spends, saves and learns inside those rules, with an **AI money tutor** to ask questions.

**Live backend:** https://teenwallet.onrender.com/health (free server, the first request after a quiet period can take up to a minute)

## How we use PayPal
We use the PayPal developer platform in the free **sandbox** (Orders v2). Code: `server/src/modules/payments/`.
1. The backend gets an OAuth access token (client credentials) and caches it.
2. When a parent tops up, `POST /api/topup/orders` creates an order and returns the PayPal approval link.
3. The parent approves in PayPal with a sandbox buyer account.
4. `POST /api/topup/orders/:orderId/capture` captures the payment and credits the teen's wallet **exactly once** (the PayPal order id is unique in the ledger, so a repeat call cannot double-credit).
5. A webhook endpoint (`PAYMENT.CAPTURE.COMPLETED`) is the backup path if the app never calls capture.

PayPal is charged in USD at a fixed demo rate (`INR_PER_USD`, default 85). The wallet itself is in rupees.

## How we use AI
The in-app **money tutor** (`POST /api/ai/ask`, code in `server/src/modules/ai/`) uses a **large language model** through any OpenAI-compatible API (Groq by default with `openai/gpt-oss-20b`; Google Gemini and OpenRouter work too, set `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`).
1. Postgres full-text search finds the lesson that best matches the teen's question.
2. The backend sends the question, that lesson and the teen's current savings goal to the model, with instructions to answer in at most 3 simple sentences, stay on money topics, and never recommend specific investments or ask for passwords or OTPs.
3. If no key is configured or the model fails or times out, the answer comes straight from the lesson, so the app never breaks. The response says which one answered (`source: "ai"` or `"lessons"`).

We also used Claude (Anthropic) as an AI coding assistant to plan the architecture, write and review code and tests, and prepare the pitch deck.

## Tools and technologies
React Native (Expo) mobile app, Node.js and Express, PostgreSQL, JWT, zod, bcryptjs, node:test.
**Sponsor tools used:** **Render** (hosts the backend) and **Postman** (we proved the PayPal sandbox flow and tested every endpoint with it). Database hosting is on Neon.

## Folders
| Folder | What is in it |
|---|---|
| `server/` | Node + Express backend API (`src/modules/...`), tests in `server/test` |
| `db/` | `schema.sql`, `seed.sql`, `migrations/` (PayPal orders, goals and lessons, lesson content) |

The Expo mobile app lives in its own folder (`app/`) once added to this repo.

## Run the backend on your computer
1. Install Node 18 or newer and PostgreSQL.
2. Create a database: `createdb teenwallet`
3. Load the tables, in this order:
   ```
   psql teenwallet -f db/schema.sql
   psql teenwallet -f db/migrations/002_paypal_orders.sql
   psql teenwallet -f db/migrations/003_goals_and_lessons.sql
   psql teenwallet -f db/migrations/seed_lessons.sql     # the 5 demo lessons and quizzes
   psql teenwallet -f db/seed.sql                         # optional demo users
   ```
4. In `server/`: `cp .env.example .env`, then fill in `DATABASE_URL`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` (use the sandbox Business app's keys) and, for the AI tutor, `AI_API_KEY`.
5. `npm install`, then `npm run demo-passwords` (only if you loaded seed.sql, it sets the password `password123` for the demo users), then `npm run dev`.
6. Check it: open http://localhost:3000/health. You should see `{"ok":true}`.
7. Run the tests: `npm test` (no database needed).

## Deploy on Render
- Create a PostgreSQL database (Render or Neon) and run the SQL files above against it.
- Create a Web Service from this repo. Root directory `server`, build command `npm install`, start command `npm start`.
- Add the variables from `.env.example`. Set `DATABASE_SSL=true`, and `PUBLIC_BASE_URL` to your Render address (https).

## Try it (demo logins)
Password for both is `password123`: `parent@example.com` and `teen@example.com`. Top-ups run in the PayPal **sandbox**, so no real money moves.

## API (all under `/api`, JSON, `Authorization: Bearer <token>` except register and login)
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
| GET / POST `/goals` | any / any | List savings goals. Create one with `{title, targetPaise}` |
| POST `/goals/:id/contribute` | teen | `{amountPaise}` moves money from the wallet into a goal. Does not use the daily limit |
| GET `/lessons`, GET `/lessons/:id` | any | Lessons with the teen's progress, one lesson with its quiz questions (no answers) |
| POST `/lessons/:id/quiz` | teen | `{answers: [0, 1, ...]}` grades the quiz, 60% completes the lesson |
| GET `/badges` | any | Badges earned |
| POST `/ai/ask` | teen | `{question}` returns the AI tutor's answer |

Money is always whole paise (100 paise = Rs 1).

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
curl -X POST localhost:3000/api/ai/ask -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"question":"How can I save for headphones?"}'
```

## Planned
Live product prices for savings goals and parent alerts when a payment is declined.

## License
MIT. Never commit `.env` or any PayPal or AI key.
