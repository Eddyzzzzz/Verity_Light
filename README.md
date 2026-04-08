# VerityLights — Jewelry Shop

A full-stack e-commerce storefront for a handcrafted jewelry business, built with Node.js/Express and SQLite. Includes a customer-facing shop and a password-protected admin dashboard.

## Features

**Shop (public)**
- Product browsing with category filters (rings, necklaces, bracelets, earrings)
- Shopping cart with persistent storage (survives page refreshes)
- Discount code support
- Checkout via Square Web Payments (card tokenization, no raw card data on your server)
- Order confirmation

**Admin dashboard** (`/admin`)
- Add, edit, and delete products with image uploads
- Edit all site text (hero copy, about section, FAQ, contact info, etc.)
- Manage the 9-color design system — changes apply live to the storefront
- Configure shipping rates and discount codes
- View recent orders with customer details

## Requirements

- Node.js 18+
- A [Square Developer account](https://developer.squareup.com) (free) for payment processing

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
PORT=3000

# Admin login password
ADMIN_PASSWORD=your-strong-password

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-random-secret

# Square credentials — get these from developer.squareup.com
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=sandbox-sq0idb-...
SQUARE_LOCATION_ID=...
SQUARE_ACCESS_TOKEN=EAAAl...

# Where to store the database and uploaded images
DATA_DIR=./data
```

### 3. Get your Square credentials

1. Go to [developer.squareup.com](https://developer.squareup.com) and sign in
2. Create an application (or open an existing one)
3. In the left sidebar, go to **Credentials**
4. Copy your **Sandbox Application ID** → `SQUARE_APPLICATION_ID`
5. Copy your **Sandbox Access Token** → `SQUARE_ACCESS_TOKEN`
6. In the left sidebar, go to **Locations** and copy a Location ID → `SQUARE_LOCATION_ID`

> Leave `SQUARE_ENVIRONMENT=sandbox` for testing. Change to `production` (with production credentials) when going live.

### 4. Run

**Development** (auto-reloads on file changes):
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The app will be available at `http://localhost:3000`.

## Usage

### Customer storefront

Visit `http://localhost:3000` to browse products and check out. For sandbox testing, use Square's [test card numbers](https://developer.squareup.com/docs/testing/test-values):

| Card number | Result |
|---|---|
| `4111 1111 1111 1111` | Success |
| `4000 0000 0000 0002` | Declined |

Use any future expiry date, any CVV, any ZIP.

### Admin dashboard

Visit `http://localhost:3000/admin` and log in with your `ADMIN_PASSWORD`.

- **Products tab** — add/edit/delete products, upload images, set stock status and badges
- **Content tab** — edit all site copy; wrap text in `|pipes|` to italicize it
- **Colors tab** — adjust the 9-color palette; changes appear on the storefront immediately
- **Settings tab** — set free shipping threshold, flat shipping rate, and discount codes
- **Orders tab** — view the last 100 orders with payment IDs and customer info

## Deployment (Railway)

The project includes a `railway.toml` for one-click deployment:

1. Push the repo to GitHub
2. Create a new Railway project from the repo
3. Add a Volume mounted at `/data` and set `DATA_DIR=/data` in environment variables
4. Set all other environment variables from `.env`
5. Railway will build and start the app automatically

The health check endpoint is `GET /api/health`.

## Project structure

```
server.js              # Express app entry point
routes/
  auth.js              # Admin login
  products.js          # Product CRUD + image uploads
  orders.js            # Square payment processing + order storage
  content.js           # CMS content and site settings
middleware/
  auth.js              # JWT validation
db/
  database.js          # SQLite setup and seed data
public/
  index.html           # Customer storefront
  admin/index.html     # Admin dashboard
data/
  db.sqlite            # SQLite database (auto-created)
  uploads/             # Product images (auto-created)
```

## Troubleshooting

**Checkout fails / payment error**
- Make sure all three Square values in `.env` are real credentials, not the placeholder `XXXXXX` values
- Confirm `SQUARE_ENVIRONMENT` matches the credentials you're using (`sandbox` vs `production`)
- Check the server console for the specific error from Square

**Admin login not working**
- The default password in `.env.example` is `admin123` — change it before deploying
- Passwords can be stored as plain text or as a bcrypt hash (any string starting with `$2`)

**Images not showing after upload**
- Check that `DATA_DIR` in `.env` is writable
- On Railway, make sure the Volume is mounted and `DATA_DIR=/data` is set
