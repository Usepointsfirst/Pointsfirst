# FlightWatch Pro — Setup Guide

## What you'll need (3 things)

### 1. SerpAPI Key (Google Flights data)
**Why:** Google Flights is the most accurate source for all-in pricing including carrier fees.
**Cost:** Free trial available. Paid plans start ~$50/mo for 5,000 searches. At 4 checks/day × 5 routes = ~600 searches/month — the Hobby plan (~$50/mo) comfortably covers this.
**Get it:**
1. Go to https://serpapi.com
2. Create a free account
3. Copy your API key from the dashboard
4. Paste into `flight_config.json` under `apis.serpapi_key`

---

### 2. Amadeus API Credentials (cross-validation)
**Why:** Free secondary source that validates Google Flights pricing.
**Cost:** Free — 2,000 API calls/month on the test environment.
**Get it:**
1. Go to https://developers.amadeus.com
2. Sign up and create an application
3. Copy the **Client ID** and **Client Secret**
4. Paste into `flight_config.json` under `apis.amadeus_client_id` and `apis.amadeus_client_secret`

> **Note:** Amadeus free tier uses test data. For live production data, you'd need to apply for their production environment. SerpAPI (Google Flights) is the primary source for real prices — Amadeus is used for cross-checking.

---

### 3. Gmail App Password (for sending email reports)
**Why:** Regular Gmail passwords don't work with SMTP. App Passwords are special 16-character codes that do.
**Get it:**
1. Go to https://myaccount.google.com
2. Click **Security** → **2-Step Verification** (must be enabled first)
3. Scroll down to **App passwords**
4. Choose app: **Mail**, device: **Other**, name it "FlightWatch"
5. Copy the 16-character password (spaces don't matter)
6. Paste into `flight_config.json` under `email.app_password`
7. Set `email.from` to your Gmail address

---

## Configuring your routes

Open `flight_config.json` and edit the `routes` array:

```json
{
  "destination": "LAX",
  "destination_name": "Los Angeles (LAX)",
  "origins": ["JFK", "LGA", "EWR"],    ← multiple airports, all compared
  "dep_date": "2026-07-15",
  "ret_date": "2026-07-22",             ← omit for one-way
  "cabin": "ECONOMY",
  "alert_threshold_usd": 300,           ← alert if price drops below $300
  "alert_pct_drop": 15                  ← also alert if 15%+ below 30-day avg
}
```

Add as many route objects as you want. Each run checks all of them.

---

## Setting your points balances

In `flight_config.json`, update `credit_cards` with your actual balances:

```json
"credit_cards": {
  "chase_ur":    85000,
  "amex_mr":     120000,
  "capital_one": 45000,
  "citi_ty":     0,      ← set to 0 to hide from reports
  "bilt":        30000
}
```

---

## Testing the setup

Once your config is filled in, open a terminal and run:

```bash
# Install Python dependencies (one-time)
pip install requests matplotlib

# Validate your config
python3 flight_monitor.py --check-config

# Send a test email (no real API calls, uses sample data)
python3 flight_monitor.py --test-email

# Run a real price check and send report
python3 flight_monitor.py
```

---

## How the alert system works

Every run:
1. Fetches current prices from Google Flights + Amadeus
2. Compares against your stored 30-day price history
3. Triggers an alert email if:
   - Price drops **at or below your threshold** (e.g., JFK→LAX below $300), **OR**
   - Price drops **X% below the rolling average** (kicks in after 3+ readings)
4. Sends the full HTML report to kennyhill0106@gmail.com

The report always shows:
- Current best price per origin airport (with trend sparkline)
- vs. 30-day average and all-time low
- Points breakdown for every enabled card (portal booking + transfer partner estimate)
- Price discrepancy warnings if sources disagree

---

## Email report layout

```
┌─────────────────────────────────────────────────────┐
│  ✈️ FlightWatch Report    June 15, 2026 · 9:00 AM   │
├─────────────────────────────────────────────────────┤
│  3 origin–destination pairs monitored  |  2 alerts  │
├─────────────────────────────────────────────────────┤
│  🔔 Price Alert Triggered                            │
│     JFK → LAX: Price $265 below your $300 target!   │
├─────────────────────────────────────────────────────┤
│  ✈️ JFK / LGA / EWR → Los Angeles (LAX)             │
│  Depart Jul 15 · Round-trip · Economy                │
│  [Price trend chart]                                 │
│  ┌──────┬───────┬──────────────┬────────┬────────┐  │
│  │Origin│ Price │   Airline    │ 30d Avg│ vs Avg │  │
│  ├──────┼───────┼──────────────┼────────┼────────┤  │
│  │ JFK  │  $265 │ Delta        │  $340  │  ↓22%  │  │
│  │ EWR  │  $289 │ United       │  $310  │  ↓ 7%  │  │
│  └──────┴───────┴──────────────┴────────┴────────┘  │
│                                                      │
│  💳 Points Options — Best: $265 (Delta, JFK→LAX)    │
│  ┌──────────┬───────────┬──────────────────┬──────┐  │
│  │ Chase UR │ 17,667 pts│ Chase Travel     │  ✅  │  │
│  │ Amex MR  │ 26,500 pts│ Amex Travel      │  ✅  │  │
│  │ Bilt     │ 21,200 pts│ Bilt Portal      │  ✅  │  │
│  └──────────┴───────────┴──────────────────┴──────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Important pricing notes

- **Google Flights prices** are the total cost you would actually pay, including base fare, all taxes, fees, and carrier surcharges. This is what we use as the authoritative price.
- **Portal points** calculations use the card's published portal booking rates. These are straightforward and accurate.
- **Transfer partner estimates** are based on typical award rates and are clearly labeled as estimates. Actual award mileage costs vary by route, travel date, and award availability. Always verify directly with the airline's loyalty program.
- The system flags when Google Flights and Amadeus prices differ by more than 8% as a data quality warning.

---

## Files created

| File | Purpose |
|------|---------|
| `flight_monitor.py` | Main application — run this |
| `flight_config.json` | Your configuration (edit this) |
| `flight_history.json` | Auto-created — stores price history |
| `flight_monitor.log` | Auto-created — run logs |
| `requirements.txt` | Python dependencies |
