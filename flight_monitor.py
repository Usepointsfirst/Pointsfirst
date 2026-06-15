#!/usr/bin/env python3
"""
FlightWatch Pro — Automated Flight Price Monitor
================================================
Monitors multiple routes from multiple origins, tracks 30-day price history,
triggers alerts when prices hit thresholds or drop significantly, calculates
credit card points options, and emails a detailed HTML report.

Usage:
  python3 flight_monitor.py                  # Run check + send report
  python3 flight_monitor.py --force-email    # Force email even without alerts
  python3 flight_monitor.py --test-email     # Send test email with sample data
  python3 flight_monitor.py --check-config   # Validate config file only
"""

import json
import os
import sys
import logging
import smtplib
import base64
import argparse
import time
import requests
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
from pathlib import Path
from statistics import mean, stdev
from typing import Optional

# ── Optional: matplotlib for trend charts ────────────────────────────────────
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    HAS_CHARTS = True
except ImportError:
    HAS_CHARTS = False

# ── File paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
CONFIG_FILE  = SCRIPT_DIR / "flight_config.json"
HISTORY_FILE = SCRIPT_DIR / "flight_history.json"
LOG_FILE     = SCRIPT_DIR / "flight_monitor.log"

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("flightwatch")

# =============================================================================
#  CREDIT CARD POINTS ENGINE
# =============================================================================

# Portal CPP (cents per point) and transfer partner CPP estimates.
# Portal booking = book directly through the card's travel portal (most reliable).
# Transfer = transfer points to an airline loyalty program (higher potential value
#            but award space must be verified — marked as estimates only).
CARDS = {
    "chase_ur": {
        "name":    "Chase Ultimate Rewards",
        "short":   "Chase UR",
        "color":   "#1A3A8A",
        "portal_cpp":   1.50,   # Sapphire Reserve rate via Chase Travel
        "portal_label": "Chase Travel Portal (1.5¢/pt)",
        "partners": {                       # airline IATA → estimated CPP
            "UA": 1.40,   # United MileagePlus
            "WN": 1.50,   # Southwest Rapid Rewards
            "BA": 1.40,   # British Airways Avios
            "AF": 1.30,   # Air France/KLM Flying Blue
            "KL": 1.30,   # KLM Flying Blue
            "SQ": 1.80,   # Singapore KrisFlyer
            "AC": 1.50,   # Air Canada Aeroplan
            "B6": 1.30,   # JetBlue TrueBlue
            "TK": 1.60,   # Turkish Miles & Smiles
            "EK": 1.40,   # Emirates Skywards
            "IB": 1.40,   # Iberia Plus Avios
        },
    },
    "amex_mr": {
        "name":    "Amex Membership Rewards",
        "short":   "Amex MR",
        "color":   "#007AC0",
        "portal_cpp":   1.00,
        "portal_label": "Amex Travel Portal (1¢/pt)",
        "partners": {
            "DL": 1.10,   # Delta SkyMiles
            "BA": 1.40,   # British Airways Avios
            "AF": 1.30,   # Air France Flying Blue
            "KL": 1.30,   # KLM Flying Blue
            "SQ": 1.80,   # Singapore KrisFlyer
            "AC": 1.50,   # Air Canada Aeroplan
            "B6": 1.30,   # JetBlue TrueBlue
            "TK": 1.60,   # Turkish Miles & Smiles
            "NH": 1.80,   # ANA Mileage Club
            "QR": 1.50,   # Qatar Privilege Club
            "AV": 1.40,   # Avianca LifeMiles
            "EK": 1.40,   # Emirates Skywards
            "CX": 1.50,   # Cathay Pacific Asia Miles
            "EY": 1.40,   # Etihad Guest
        },
    },
    "capital_one": {
        "name":    "Capital One Miles",
        "short":   "Cap One",
        "color":   "#D03027",
        "portal_cpp":   1.00,
        "portal_label": "Capital One Travel (1¢/pt)",
        "partners": {
            "AC": 1.50,   # Air Canada Aeroplan
            "TK": 1.60,   # Turkish Miles & Smiles
            "AV": 1.40,   # Avianca LifeMiles
            "BA": 1.40,   # British Airways Avios
            "AF": 1.30,   # Air France Flying Blue
            "KL": 1.30,   # KLM Flying Blue
            "SQ": 1.80,   # Singapore KrisFlyer
            "WN": 1.50,   # Southwest Rapid Rewards
        },
    },
    "citi_ty": {
        "name":    "Citi ThankYou Points",
        "short":   "Citi TY",
        "color":   "#003B6A",
        "portal_cpp":   1.00,
        "portal_label": "Citi Travel Portal (1¢/pt)",
        "partners": {
            "AA": 1.40,   # American AAdvantage
            "TK": 1.60,   # Turkish Miles & Smiles
            "SQ": 1.80,   # Singapore KrisFlyer
            "EY": 1.40,   # Etihad Guest
            "AV": 1.40,   # Avianca LifeMiles
            "AF": 1.30,   # Air France Flying Blue
            "KL": 1.30,   # KLM Flying Blue
            "CX": 1.50,   # Cathay Pacific Asia Miles
        },
    },
    "bilt": {
        "name":    "Bilt Rewards",
        "short":   "Bilt",
        "color":   "#1C1C1C",
        "portal_cpp":   1.25,
        "portal_label": "Bilt Travel Portal (1.25¢/pt)",
        "partners": {
            "AA": 1.40,   # American AAdvantage
            "UA": 1.40,   # United MileagePlus
            "AC": 1.50,   # Air Canada Aeroplan
            "AS": 1.40,   # Alaska Mileage Plan
            "AV": 1.40,   # Avianca LifeMiles
            "BA": 1.40,   # British Airways Avios
            "AF": 1.30,   # Air France Flying Blue
            "KL": 1.30,   # KLM Flying Blue
            "SQ": 1.80,   # Singapore KrisFlyer
            "TK": 1.60,   # Turkish Miles & Smiles
        },
    },
}

# Airline IATA → display name
AIRLINE_NAMES = {
    "AA": "American Airlines",  "UA": "United Airlines",
    "DL": "Delta Air Lines",    "WN": "Southwest Airlines",
    "B6": "JetBlue Airways",    "AS": "Alaska Airlines",
    "NK": "Spirit Airlines",    "F9": "Frontier Airlines",
    "G4": "Allegiant Air",
    "BA": "British Airways",    "AF": "Air France",
    "KL": "KLM",                "LH": "Lufthansa",
    "AC": "Air Canada",         "SQ": "Singapore Airlines",
    "TK": "Turkish Airlines",   "EK": "Emirates",
    "QR": "Qatar Airways",      "EY": "Etihad Airways",
    "AV": "Avianca",            "NH": "ANA",
    "CX": "Cathay Pacific",     "IB": "Iberia",
    "AZ": "ITA Airways",        "VS": "Virgin Atlantic",
    "VX": "Virgin America",
}


def calc_points_options(price: float, balances: dict, airline_iata: str = "") -> list:
    """
    For a given cash price, calculate points needed from each card.
    Returns list sorted by fewest points needed (best value first).
    """
    options = []
    for card_key, balance in balances.items():
        if not balance:
            continue
        card = CARDS.get(card_key)
        if not card:
            continue

        cpp          = card["portal_cpp"]
        pts_needed   = int((price / cpp) * 100)
        can_cover    = balance >= pts_needed
        shortfall    = max(0, pts_needed - balance)
        cash_gap     = round(shortfall * cpp / 100, 2)

        # Transfer partner option if airline is known
        transfer = None
        if airline_iata and airline_iata in card.get("partners", {}):
            est_cpp = card["partners"][airline_iata]
            transfer = {
                "est_cpp":          est_cpp,
                "est_pts_needed":   int((price / est_cpp) * 100),
                "note": (
                    "Estimate based on typical award rates. "
                    "Actual award cost and availability must be verified "
                    "directly with the airline loyalty program."
                ),
            }

        options.append({
            "card":             card["name"],
            "short":            card["short"],
            "card_key":         card_key,
            "color":            card["color"],
            "portal_cpp":       cpp,
            "portal_label":     card["portal_label"],
            "pts_needed":       pts_needed,
            "balance":          balance,
            "can_cover_fully":  can_cover,
            "shortfall_pts":    shortfall,
            "cash_gap":         cash_gap,
            "transfer":         transfer,
        })

    return sorted(options, key=lambda x: x["pts_needed"])


# =============================================================================
#  FLIGHT FETCHER
# =============================================================================

class FlightFetcher:
    """Fetches flight prices from SerpAPI (Google Flights) and Amadeus."""

    def __init__(self, apis: dict):
        self.serpapi_key      = apis.get("serpapi_key", "")
        self.amadeus_id       = apis.get("amadeus_client_id", "")
        self.amadeus_secret   = apis.get("amadeus_client_secret", "")
        self._token           = None
        self._token_exp       = None

    # ── Amadeus auth ─────────────────────────────────────────────────────────

    def _amadeus_auth(self) -> Optional[str]:
        if self._token and self._token_exp and datetime.now() < self._token_exp:
            return self._token
        if not self.amadeus_id or self.amadeus_id.startswith("YOUR_"):
            return None
        try:
            r = requests.post(
                "https://test.api.amadeus.com/v1/security/oauth2/token",
                data={
                    "grant_type":    "client_credentials",
                    "client_id":     self.amadeus_id,
                    "client_secret": self.amadeus_secret,
                },
                timeout=10,
            )
            if r.ok:
                d = r.json()
                self._token     = d["access_token"]
                self._token_exp = datetime.now() + timedelta(seconds=d["expires_in"] - 60)
                return self._token
            log.warning(f"Amadeus auth failed: {r.status_code}")
        except Exception as e:
            log.warning(f"Amadeus auth error: {e}")
        return None

    @staticmethod
    def _parse_iso_duration(s: str) -> int:
        """Parse 'PT2H30M' → 150 minutes."""
        try:
            s = s.replace("PT", "")
            h = int(s.split("H")[0]) if "H" in s else 0
            m_part = s.split("H")[1] if "H" in s else s
            m = int(m_part.replace("M", "")) if "M" in m_part else 0
            return h * 60 + m
        except Exception:
            return 0

    @staticmethod
    def _iata_from_name(name: str) -> str:
        """Attempt to find IATA code from airline name."""
        for code, n in AIRLINE_NAMES.items():
            if n.lower() == name.lower().strip():
                return code
        return ""

    # ── SerpAPI / Google Flights ──────────────────────────────────────────────

    def _fetch_serpapi(
        self, origin: str, dest: str, dep_date: str,
        ret_date: Optional[str], cabin_int: int
    ) -> list:
        if not self.serpapi_key or self.serpapi_key.startswith("YOUR_"):
            log.info("SerpAPI key not configured — skipping Google Flights source")
            return []

        params = {
            "engine":        "google_flights",
            "departure_id":  origin,
            "arrival_id":    dest,
            "outbound_date": dep_date,
            "currency":      "USD",
            "type":          1 if ret_date else 2,
            "travel_class":  cabin_int,
            "hl":            "en",
            "api_key":       self.serpapi_key,
        }
        if ret_date:
            params["return_date"] = ret_date

        try:
            r = requests.get("https://serpapi.com/search", params=params, timeout=30)
            if not r.ok:
                log.error(f"SerpAPI error {r.status_code}: {r.text[:300]}")
                return []

            data = r.json()
            results, seen = [], set()

            for key in ("best_flights", "other_flights"):
                for f in data.get(key, []):
                    price = f.get("price")
                    if not price or price in seen:
                        continue
                    seen.add(price)

                    legs     = f.get("flights", [])
                    airline  = legs[0].get("airline", "Unknown") if legs else "Unknown"
                    iata     = self._iata_from_name(airline)
                    stops    = max(0, len(legs) - 1)
                    dur_min  = f.get("total_duration", 0)

                    results.append({
                        "origin":      origin,
                        "destination": dest,
                        "dep_date":    dep_date,
                        "ret_date":    ret_date,
                        "price":       float(price),
                        # Google Flights always shows the TOTAL price (base + taxes + fees)
                        "price_note":  "Total price per Google Flights — includes all taxes, fees & carrier surcharges",
                        "airline":     airline,
                        "airline_iata": iata,
                        "stops":       stops,
                        "duration_min": dur_min,
                        "source":      "google_flights",
                        "ts":          datetime.now().isoformat(),
                    })

            log.info(f"SerpAPI: {len(results)} results  {origin} → {dest}  {dep_date}")
            return results

        except Exception as e:
            log.error(f"SerpAPI fetch error: {e}")
            return []

    # ── Amadeus ──────────────────────────────────────────────────────────────

    def _fetch_amadeus(
        self, origin: str, dest: str, dep_date: str,
        ret_date: Optional[str], cabin: str
    ) -> list:
        token = self._amadeus_auth()
        if not token:
            return []

        params = {
            "originLocationCode":      origin,
            "destinationLocationCode": dest,
            "departureDate":           dep_date,
            "adults":                  1,
            "currencyCode":            "USD",
            "travelClass":             cabin,
            "max":                     15,
        }
        if ret_date:
            params["returnDate"] = ret_date

        try:
            r = requests.get(
                "https://test.api.amadeus.com/v2/shopping/flight-offers",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
                timeout=30,
            )
            if not r.ok:
                log.warning(f"Amadeus {r.status_code}: {r.text[:300]}")
                return []

            results = []
            for offer in r.json().get("data", []):
                total = float(offer.get("price", {}).get("grandTotal", 0))
                if not total:
                    continue

                its   = offer.get("itineraries", [])
                segs  = its[0].get("segments", []) if its else []
                code  = segs[0].get("carrierCode", "") if segs else ""
                name  = AIRLINE_NAMES.get(code, code)
                stops = max(0, len(segs) - 1)
                dur   = self._parse_iso_duration(its[0].get("duration", "PT0M")) if its else 0

                results.append({
                    "origin":       origin,
                    "destination":  dest,
                    "dep_date":     dep_date,
                    "ret_date":     ret_date,
                    "price":        total,
                    "price_note":   "Total price including taxes (Amadeus GDS)",
                    "airline":      name,
                    "airline_iata": code,
                    "stops":        stops,
                    "duration_min": dur,
                    "source":       "amadeus",
                    "ts":           datetime.now().isoformat(),
                })

            log.info(f"Amadeus: {len(results)} results  {origin} → {dest}  {dep_date}")
            return results

        except Exception as e:
            log.error(f"Amadeus fetch error: {e}")
            return []

    # ── Combined fetch ────────────────────────────────────────────────────────

    def fetch(
        self, origin: str, dest: str, dep_date: str,
        ret_date: Optional[str] = None, cabin: str = "ECONOMY"
    ) -> dict:
        """
        Fetch from all configured sources and return consolidated best price.
        Google Flights is used as the authoritative price (includes all fees).
        Amadeus serves as a cross-validation source.
        """
        cabin_int = {"ECONOMY": 1, "PREMIUM_ECONOMY": 2, "BUSINESS": 3, "FIRST": 4}.get(cabin, 1)

        serp = self._fetch_serpapi(origin, dest, dep_date, ret_date, cabin_int)
        ama  = self._fetch_amadeus(origin, dest, dep_date, ret_date, cabin)

        all_r = serp + ama
        if not all_r:
            log.warning(f"No results from any source for {origin}→{dest} on {dep_date}")
            return {}

        # Best result: prefer Google Flights (more inclusive of fees)
        best = (
            min(serp, key=lambda x: x["price"]) if serp
            else min(ama,  key=lambda x: x["price"])
        )

        # Cross-source discrepancy warning
        cross_note = None
        if serp and ama:
            g_min = min(x["price"] for x in serp)
            a_min = min(x["price"] for x in ama)
            diff  = abs(g_min - a_min) / g_min * 100
            if diff > 8:
                cross_note = (
                    f"⚠️ Sources differ by {diff:.0f}%: "
                    f"Google Flights ${g_min:.0f} vs Amadeus ${a_min:.0f}. "
                    "Google Flights price used — it includes all fees."
                )

        return {
            "best":             best,
            "all_results":      all_r,
            "cross_note":       cross_note,
            "source_counts":    {"google_flights": len(serp), "amadeus": len(ama)},
        }


# =============================================================================
#  HISTORICAL DATA MANAGER
# =============================================================================

class HistoryManager:
    """Stores price readings in a local JSON file and computes statistics."""

    def __init__(self, path: Path):
        self.path = path
        self.data = self._load()

    def _load(self) -> dict:
        if self.path.exists():
            try:
                return json.loads(self.path.read_text())
            except Exception:
                log.warning("Could not parse history file — starting fresh")
        return {}

    def _save(self):
        self.path.write_text(json.dumps(self.data, indent=2))

    def _key(self, origin: str, dest: str, dep_date: str, ret_date: Optional[str]) -> str:
        k = f"{origin}-{dest}-{dep_date}"
        return k + (f"|r{ret_date}" if ret_date else "")

    def add(self, origin: str, dest: str, dep_date: str, price: float,
            airline: str, ret_date: Optional[str] = None):
        key = self._key(origin, dest, dep_date, ret_date)
        if key not in self.data:
            self.data[key] = []

        self.data[key].append({
            "ts":      datetime.now().isoformat(),
            "price":   round(price, 2),
            "airline": airline,
        })

        # Prune records older than 90 days
        cutoff = (datetime.now() - timedelta(days=90)).isoformat()
        self.data[key] = [r for r in self.data[key] if r["ts"] >= cutoff]
        self._save()

    def get_stats(self, origin: str, dest: str, dep_date: str,
                  ret_date: Optional[str] = None, days: int = 30) -> dict:
        key     = self._key(origin, dest, dep_date, ret_date)
        records = self.data.get(key, [])
        cutoff  = (datetime.now() - timedelta(days=days)).isoformat()
        recent  = [r["price"] for r in records if r["ts"] >= cutoff]

        if not recent:
            return {"count": 0, "records": records}

        return {
            "count":   len(recent),
            "avg":     round(mean(recent), 2),
            "min":     round(min(recent), 2),
            "max":     round(max(recent), 2),
            "std":     round(stdev(recent), 2) if len(recent) > 1 else 0.0,
            "records": [r for r in records if r["ts"] >= cutoff],
        }

    def check_alerts(
        self, origin: str, dest: str, dep_date: str, current_price: float,
        threshold_usd: Optional[float] = None, pct_drop: Optional[float] = None,
        ret_date: Optional[str] = None
    ) -> dict:
        stats  = self.get_stats(origin, dest, dep_date, ret_date)
        alerts = []

        # Threshold alert
        if threshold_usd and current_price <= threshold_usd:
            alerts.append({
                "type": "threshold",
                "msg":  f"Price ${current_price:.0f} is at or below your ${threshold_usd:.0f} target!",
            })

        # % drop alert (only meaningful after 3+ readings)
        if pct_drop and stats.get("count", 0) >= 3:
            avg  = stats["avg"]
            drop = (avg - current_price) / avg * 100
            if drop >= pct_drop:
                alerts.append({
                    "type": "pct_drop",
                    "msg":  (
                        f"Price ${current_price:.0f} is {drop:.1f}% below "
                        f"the {stats['count']}-reading average of ${avg:.0f}!"
                    ),
                })

        return {"triggered": bool(alerts), "alerts": alerts, "stats": stats}


# =============================================================================
#  CHART GENERATION
# =============================================================================

def _fig_to_b64(fig) -> str:
    buf = BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", dpi=110)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def make_sparkline(records: list, current_price: float) -> str:
    """Tiny 130×40 price sparkline embedded as base64 PNG."""
    if not HAS_CHARTS:
        return ""
    prices = [r["price"] for r in records[-28:]] + [current_price]
    if len(prices) < 2:
        return ""
    fig, ax = plt.subplots(figsize=(1.3, 0.4), dpi=110)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    x = range(len(prices))
    ax.plot(x, prices, color="#1A3A8A", linewidth=1.5, solid_capstyle="round")
    ax.fill_between(x, prices, min(prices) * 0.995, alpha=0.15, color="#1A3A8A")
    ax.plot(len(prices) - 1, current_price, "o", color="#D03027", markersize=3.5, zorder=5)
    ax.set_xlim(0, len(prices) - 1)
    ax.axis("off")
    plt.tight_layout(pad=0)
    return _fig_to_b64(fig)


def make_trend_chart(all_route_results: list) -> str:
    """
    Multi-line trend chart showing price history for all origins in a route group.
    Returns base64 PNG or empty string.
    """
    if not HAS_CHARTS:
        return ""

    has_data = any(
        r.get("history", {}).get("records")
        for r in all_route_results
        if r.get("current_price")
    )
    if not has_data:
        return ""

    COLORS = ["#1A3A8A", "#D03027", "#007AC0", "#1C1C1C", "#16A34A", "#D97706"]
    fig, ax = plt.subplots(figsize=(6.2, 2.2), dpi=110)
    fig.patch.set_facecolor("#FAFAFA")
    ax.set_facecolor("#FAFAFA")

    for i, r in enumerate(all_route_results):
        if not r.get("current_price"):
            continue
        hist = r.get("history", {})
        recs = hist.get("records", [])
        if not recs:
            continue

        dates  = [datetime.fromisoformat(rec["ts"]) for rec in recs] + [datetime.now()]
        prices = [rec["price"] for rec in recs] + [r["current_price"]]
        c = COLORS[i % len(COLORS)]

        label = f"{r['origin']} → {r['dest']}"
        ax.plot(dates, prices, color=c, linewidth=1.8, label=label,
                marker="o", markersize=2.5, solid_capstyle="round")

    ax.xaxis.set_major_formatter(mdates.DateFormatter("%m/%d"))
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    for tick in ax.get_xticklabels():
        tick.set_fontsize(7); tick.set_color("#555")
    for tick in ax.get_yticklabels():
        tick.set_fontsize(7); tick.set_color("#555")

    ax.set_ylabel("USD", fontsize=7, color="#555")
    ax.yaxis.set_major_formatter(lambda v, _: f"${v:.0f}")
    ax.grid(axis="y", linestyle="--", alpha=0.35, color="#ccc")
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color("#ddd")
    ax.spines["bottom"].set_color("#ddd")

    if len(all_route_results) > 1:
        ax.legend(fontsize=7, loc="upper right", framealpha=0.9, edgecolor="#ddd")

    plt.tight_layout()
    return _fig_to_b64(fig)


# =============================================================================
#  HTML EMAIL GENERATOR
# =============================================================================

_CSS = """
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;background:#F3F4F6;}
table{border-collapse:collapse;}
"""

def _pct_badge(current: float, avg: float) -> tuple:
    """Return (text, color) for the vs-avg badge."""
    if not avg:
        return ("—", "#9CA3AF")
    pct  = (current - avg) / avg * 100
    sign = "↓" if pct < 0 else "↑"
    col  = "#16A34A" if pct < 0 else "#DC2626"
    return (f"{sign} {abs(pct):.0f}%", col)


def generate_html_email(report: dict, config: dict) -> str:
    now_str    = datetime.now().strftime("%B %d, %Y  ·  %I:%M %p")
    balances   = config.get("credit_cards", {})

    # ── Collect triggered alerts ──────────────────────────────────────────────
    all_alerts = []
    for route in report.get("routes", []):
        for res in route.get("results", []):
            if res.get("alert", {}).get("triggered"):
                for a in res["alert"]["alerts"]:
                    all_alerts.append(
                        f"<li><b>{res['origin']} → {route['destination']}</b>: {a['msg']}</li>"
                    )

    alert_banner = ""
    if all_alerts:
        alert_banner = f"""
        <div style="background:#FFF3CD;border-left:5px solid #FFC107;padding:14px 18px;
                    margin:18px 0;border-radius:6px;">
          <p style="margin:0 0 6px;font-weight:700;color:#92400E;font-size:14px;">🔔 Price Alert Triggered</p>
          <ul style="margin:0;padding-left:18px;color:#92400E;font-size:13px;">
            {''.join(all_alerts)}
          </ul>
        </div>"""

    # ── Build each route section ──────────────────────────────────────────────
    route_sections = ""

    for route in report.get("routes", []):
        dest      = route["destination"]
        dest_name = route.get("destination_name", dest)
        dep       = route.get("dep_date", "")
        ret       = route.get("ret_date", "")
        cabin     = route.get("cabin", "Economy")
        trip_type = f"Round-trip · Return {ret}" if ret else "One-way"

        results   = route.get("results", [])

        # Trend chart
        chart_b64 = make_trend_chart(results)
        chart_html = (
            f'<img src="data:image/png;base64,{chart_b64}" '
            f'width="620" style="max-width:100%;border-radius:6px;margin-bottom:10px;" />'
            if chart_b64 else ""
        )

        # Price table rows
        rows_html = ""
        for res in results:
            if res.get("error"):
                rows_html += f"""
                <tr><td colspan="7" style="padding:10px;color:#9CA3AF;font-size:12px;">
                  {res['origin']}: {res['error']}</td></tr>"""
                continue

            price      = res.get("current_price")
            if not price:
                continue

            airline    = res.get("airline", "—")
            stops_txt  = "Nonstop" if res.get("stops") == 0 else f"{res['stops']} stop(s)"
            dur        = res.get("duration_min", 0)
            dur_txt    = f"{dur//60}h {dur%60}m" if dur else "—"
            hist       = res.get("history", {})
            pct_txt, pct_col = _pct_badge(price, hist.get("avg"))
            alert_flag = res.get("alert", {}).get("triggered", False)
            badge      = (' <span style="background:#EF4444;color:#fff;font-size:9px;'
                          'padding:2px 5px;border-radius:8px;font-weight:700;'
                          'vertical-align:middle;">ALERT</span>' if alert_flag else "")
            spark_b64  = make_sparkline(hist.get("records", []), price)
            spark_img  = (f'<img src="data:image/png;base64,{spark_b64}" '
                          f'width="130" height="40" style="vertical-align:middle;"/>'
                          if spark_b64 else "")
            source_tag = "GF + Ama" if res.get("source") == "google_flights" else "Amadeus"
            cross       = res.get("cross_note", "")
            cross_html  = (f'<div style="font-size:10px;color:#D97706;margin-top:2px;">'
                           f'{cross}</div>' if cross else "")

            rows_html += f"""
            <tr style="border-bottom:1px solid #F3F4F6;">
              <td style="padding:11px 10px;font-size:13px;font-weight:700;white-space:nowrap;">
                {res['origin']}{badge}{cross_html}</td>
              <td style="padding:11px 10px;font-size:20px;font-weight:800;color:#1A3A8A;">${price:.0f}</td>
              <td style="padding:11px 10px;font-size:12px;color:#374151;">{airline}</td>
              <td style="padding:11px 10px;font-size:12px;color:#6B7280;">{stops_txt} · {dur_txt}</td>
              <td style="padding:11px 10px;font-size:12px;color:#6B7280;">
                Avg ${hist.get('avg', 0):.0f}  /  Lo ${hist.get('min', 0):.0f}</td>
              <td style="padding:11px 10px;font-size:13px;font-weight:700;color:{pct_col};">{pct_txt}</td>
              <td style="padding:11px 10px;">{spark_img}</td>
            </tr>"""

        # Points table (for cheapest available origin on this route)
        valid_results = [r for r in results if r.get("current_price")]
        points_html = ""
        if valid_results:
            best_r     = min(valid_results, key=lambda x: x["current_price"])
            best_price = best_r["current_price"]
            iata       = best_r.get("airline_iata", "")
            opts       = calc_points_options(best_price, balances, iata)

            if opts:
                pts_rows = ""
                for opt in opts:
                    status_col = "#16A34A" if opt["can_cover_fully"] else "#D97706"
                    status_txt = (
                        "✅ Fully covered by your balance"
                        if opt["can_cover_fully"]
                        else f"⚠️ {opt['shortfall_pts']:,} pts short — ${opt['cash_gap']:.2f} gap"
                    )
                    xfer_html = ""
                    if opt.get("transfer"):
                        t = opt["transfer"]
                        xfer_html = (
                            f'<div style="font-size:10px;color:#6B7280;margin-top:3px;">'
                            f'Transfer option: ~{t["est_pts_needed"]:,} pts @ {t["est_cpp"]:.1f}¢/pt (estimate — verify award availability)</div>'
                        )

                    pts_rows += f"""
                    <tr style="border-bottom:1px solid #F9FAFB;">
                      <td style="padding:9px 10px;">
                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
                              background:{opt['color']};margin-right:7px;vertical-align:middle;"></span>
                        <span style="font-size:13px;font-weight:600;">{opt['short']}</span>
                      </td>
                      <td style="padding:9px 10px;font-size:13px;"><b>{opt['pts_needed']:,}</b> pts</td>
                      <td style="padding:9px 10px;font-size:12px;color:#6B7280;">{opt['portal_label']}</td>
                      <td style="padding:9px 10px;font-size:12px;color:#6B7280;">
                        Balance: {opt['balance']:,}</td>
                      <td style="padding:9px 10px;font-size:12px;color:{status_col};">
                        {status_txt}{xfer_html}</td>
                    </tr>"""

                points_html = f"""
                <div style="margin-top:14px;">
                  <p style="font-size:12px;font-weight:700;color:#374151;margin:0 0 6px;">
                    💳 Points Options — Best Available: ${best_price:.0f} ({best_r.get('airline','')}, {best_r['origin']} → {dest})
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="background:#F9FAFB;border-radius:8px;overflow:hidden;">
                    <thead>
                      <tr style="background:#F3F4F6;">
                        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Card</th>
                        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Pts Needed</th>
                        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Via</th>
                        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Balance</th>
                        <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>{pts_rows}</tbody>
                  </table>
                  <p style="font-size:10px;color:#9CA3AF;margin:6px 0 0;">
                    ★ All prices include taxes, fees, and carrier surcharges.
                    Points values are based on portal booking rates.
                    Transfer award estimates require verification with the airline.
                  </p>
                </div>"""

        route_sections += f"""
        <div style="background:white;border:1px solid #E5E7EB;border-radius:12px;
                    padding:20px;margin-bottom:20px;">
          <div style="margin-bottom:14px;">
            <h2 style="margin:0;font-size:17px;font-weight:800;color:#111827;">
              ✈️ {', '.join(r['origin'] for r in valid_results)} → {dest_name} ({dest})
            </h2>
            <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">
              Depart {dep} · {trip_type} · {cabin} class
            </p>
          </div>

          {chart_html}

          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background:#F8FAFC;border-radius:6px;">
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Origin</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Current Price</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Airline</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Flight</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">30-Day Avg / Low</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">vs Avg</th>
                <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Trend</th>
              </tr>
            </thead>
            <tbody>{rows_html}</tbody>
          </table>

          {points_html}
        </div>"""

    # ── Header stats ──────────────────────────────────────────────────────────
    total_pairs   = sum(len(r.get("results", [])) for r in report.get("routes", []))
    alert_count   = len(all_alerts)
    alert_color   = "#EF4444" if alert_count else "#6B7280"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlightWatch Report</title>
  <style>{_CSS}</style>
</head>
<body>
<div style="max-width:720px;margin:20px auto;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1A3A8A 0%,#0F2461 100%);
              padding:28px 26px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-.3px;">
      ✈️ FlightWatch Report
    </h1>
    <p style="margin:5px 0 0;color:rgba(255,255,255,.7);font-size:13px;">{now_str}</p>
  </div>

  <!-- Stats bar -->
  <div style="background:white;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;
              padding:12px 26px;display:flex;gap:28px;flex-wrap:wrap;">
    <span style="font-size:13px;color:#6B7280;">
      <b style="color:#111;">{total_pairs}</b> origin–destination pairs monitored
    </span>
    <span style="font-size:13px;color:{alert_color};">
      <b>{alert_count}</b> alert{'s' if alert_count!=1 else ''} triggered
    </span>
    <span style="font-size:13px;color:#6B7280;">
      Prices include all taxes &amp; fees
    </span>
  </div>

  <!-- Body -->
  <div style="padding:18px 10px;">
    {alert_banner}
    {route_sections}

    <!-- Footer -->
    <div style="text-align:center;padding:14px;font-size:11px;color:#9CA3AF;line-height:1.6;">
      <b>FlightWatch Pro</b> · Google Flights + Amadeus · Kenny Hill<br/>
      All prices are total cost including taxes, fees, and carrier surcharges.<br/>
      Points calculations use portal booking rates. Transfer award values are estimates only.<br/>
      Always confirm price and availability on the airline's website before booking.
    </div>
  </div>

</div>
</body>
</html>"""

    return html


# =============================================================================
#  EMAIL SENDER
# =============================================================================

def send_email(html: str, config: dict, subject: str) -> bool:
    ecfg    = config.get("email", {})
    to_addr = ecfg.get("to", "")
    fr_addr = ecfg.get("from", "")
    app_pw  = ecfg.get("app_password", "")

    if not all([to_addr, fr_addr, app_pw]) or app_pw.startswith("YOUR_"):
        log.error(
            "Email not configured. Set email.from, email.to, email.app_password in flight_config.json"
        )
        # Fallback: save HTML report locally
        out = SCRIPT_DIR / f"flight_report_{datetime.now().strftime('%Y%m%d_%H%M')}.html"
        out.write_text(html)
        log.info(f"Report saved locally as fallback: {out}")
        return False

    msg              = MIMEMultipart("alternative")
    msg["Subject"]   = subject
    msg["From"]      = fr_addr
    msg["To"]        = to_addr
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as srv:
            srv.login(fr_addr, app_pw)
            srv.sendmail(fr_addr, to_addr, msg.as_string())
        log.info(f"✅ Report emailed to {to_addr}")
        return True
    except smtplib.SMTPAuthenticationError:
        log.error(
            "Gmail authentication failed. "
            "Make sure you are using an App Password (not your main Gmail password). "
            "See: https://myaccount.google.com/apppasswords"
        )
    except Exception as e:
        log.error(f"Email send failed: {e}")

    # Fallback
    out = SCRIPT_DIR / f"flight_report_{datetime.now().strftime('%Y%m%d_%H%M')}.html"
    out.write_text(html)
    log.info(f"Report saved locally: {out}")
    return False


# =============================================================================
#  MAIN ORCHESTRATOR
# =============================================================================

def load_config() -> dict:
    if not CONFIG_FILE.exists():
        print(f"\n❌ Config file not found: {CONFIG_FILE}")
        print("   Copy flight_config.json from the template and fill in your settings.\n")
        sys.exit(1)
    try:
        return json.loads(CONFIG_FILE.read_text())
    except json.JSONDecodeError as e:
        print(f"\n❌ Invalid JSON in config file: {e}\n")
        sys.exit(1)


def run_monitor(config: dict, force_email: bool = False) -> dict:
    """Main pipeline: fetch → store → alert → email."""
    fetcher = FlightFetcher(config.get("apis", {}))
    history = HistoryManager(HISTORY_FILE)
    report  = {"routes": [], "ts": datetime.now().isoformat()}
    any_alert = False

    for rc in config.get("routes", []):
        dest      = rc.get("destination", "")
        dep_date  = rc.get("dep_date", "")
        ret_date  = rc.get("ret_date")
        cabin     = rc.get("cabin", "ECONOMY").upper()
        threshold = rc.get("alert_threshold_usd")
        pct_drop  = rc.get("alert_pct_drop", 15)
        origins   = rc.get("origins") or ([rc["origin"]] if rc.get("origin") else [])

        if not dest or not dep_date:
            log.warning(f"Route missing destination or dep_date — skipping: {rc}")
            continue
        if not origins:
            log.warning(f"Route to {dest} has no origins defined — skipping")
            continue

        route_entry = {
            "destination":      dest,
            "destination_name": rc.get("destination_name", dest),
            "dep_date":         dep_date,
            "ret_date":         ret_date,
            "cabin":            cabin.capitalize(),
            "results":          [],
        }

        for origin in origins:
            log.info(f"── Fetching  {origin} → {dest}  {dep_date}  ({cabin})")
            fetch = fetcher.fetch(origin, dest, dep_date, ret_date, cabin)

            if not fetch or not fetch.get("best"):
                route_entry["results"].append({
                    "origin": origin, "dest": dest,
                    "error": "No results returned from any data source."
                })
                continue

            best          = fetch["best"]
            current_price = best["price"]
            airline       = best.get("airline", "Unknown")
            airline_iata  = best.get("airline_iata", "")

            # Persist to history
            history.add(origin, dest, dep_date, current_price, airline, ret_date)

            # Alert check
            alert = history.check_alerts(
                origin, dest, dep_date, current_price,
                threshold_usd=threshold,
                pct_drop=pct_drop,
                ret_date=ret_date,
            )
            if alert["triggered"]:
                any_alert = True

            route_entry["results"].append({
                "origin":        origin,
                "dest":          dest,
                "current_price": current_price,
                "airline":       airline,
                "airline_iata":  airline_iata,
                "stops":         best.get("stops", 0),
                "duration_min":  best.get("duration_min", 0),
                "price_note":    best.get("price_note", ""),
                "source":        best.get("source", ""),
                "cross_note":    fetch.get("cross_note"),
                "alert":         alert,
                "history":       alert["stats"],
            })

            time.sleep(1.2)   # Polite API rate-limiting

        report["routes"].append(route_entry)

    # ── Send report ───────────────────────────────────────────────────────────
    always_send = config.get("always_send_report", True)
    if force_email or any_alert or always_send:
        prefix  = "🔔 PRICE ALERT — " if any_alert else ""
        subject = f"{prefix}FlightWatch Report — {datetime.now().strftime('%b %d, %Y')}"
        html    = generate_html_email(report, config)
        send_email(html, config, subject)
    else:
        log.info("No alerts triggered and always_send_report is false — skipping email")

    return report


def _build_test_report() -> dict:
    """Build a realistic sample report for testing email output."""
    base_records = [
        {"ts": (datetime.now() - timedelta(days=d)).isoformat(),
         "price": 340 + ((d * 7 + 3) % 11 - 5) * 8,
         "airline": "Delta Air Lines"}
        for d in range(28, 0, -1)
    ]
    return {
        "routes": [{
            "destination": "LAX",
            "destination_name": "Los Angeles (LAX)",
            "dep_date": "2026-07-15",
            "ret_date": "2026-07-22",
            "cabin": "Economy",
            "results": [
                {
                    "origin": "JFK", "dest": "LAX",
                    "current_price": 265.00,
                    "airline": "Delta Air Lines",
                    "airline_iata": "DL",
                    "stops": 0, "duration_min": 325,
                    "source": "google_flights",
                    "price_note": "Total price from Google Flights — includes all taxes, fees & carrier surcharges",
                    "cross_note": None,
                    "alert": {
                        "triggered": True,
                        "alerts": [
                            {"type": "threshold", "msg": "Price $265 is at or below your $300 target!"},
                            {"type": "pct_drop", "msg": "Price $265 is 22.1% below the 28-reading average of $340!"},
                        ],
                        "stats": {"count": 28, "avg": 340.0, "min": 260.0, "max": 420.0},
                    },
                    "history": {"count": 28, "avg": 340.0, "min": 260.0, "max": 420.0, "records": base_records},
                },
                {
                    "origin": "EWR", "dest": "LAX",
                    "current_price": 289.00,
                    "airline": "United Airlines",
                    "airline_iata": "UA",
                    "stops": 1, "duration_min": 380,
                    "source": "google_flights",
                    "cross_note": None,
                    "alert": {"triggered": False, "alerts": [], "stats": {"count": 15, "avg": 310.0}},
                    "history": {"count": 15, "avg": 310.0, "min": 275.0, "max": 390.0,
                                "records": base_records[:15]},
                },
            ],
        }],
        "ts": datetime.now().isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="FlightWatch Pro — Flight Price Monitor")
    parser.add_argument("--force-email",  action="store_true",
                        help="Send report even when no alerts triggered")
    parser.add_argument("--test-email",   action="store_true",
                        help="Send test email with sample data (no real API calls)")
    parser.add_argument("--check-config", action="store_true",
                        help="Validate config file and print a summary")
    args = parser.parse_args()

    config = load_config()

    if args.check_config:
        apis     = config.get("apis", {})
        email    = config.get("email", {})
        cards    = config.get("credit_cards", {})
        routes   = config.get("routes", [])
        serp_ok  = bool(apis.get("serpapi_key", "").strip()) and not apis.get("serpapi_key", "").startswith("YOUR_")
        ama_ok   = bool(apis.get("amadeus_client_id", "").strip()) and not apis.get("amadeus_client_id", "").startswith("YOUR_")
        email_ok = bool(email.get("app_password", "").strip()) and not email.get("app_password", "").startswith("YOUR_")
        print("\n─── FlightWatch Config Check ───────────────────────")
        print(f"  SerpAPI (Google Flights) : {'✅ Configured' if serp_ok else '❌ Not configured'}")
        print(f"  Amadeus API              : {'✅ Configured' if ama_ok else '❌ Not configured'}")
        print(f"  Gmail email send         : {'✅ Configured' if email_ok else '❌ Not configured'}")
        print(f"  Sending to               : {email.get('to', '(not set)')}")
        print(f"  Routes defined           : {len(routes)}")
        print(f"  Credit cards enabled     : {sum(1 for v in cards.values() if v)}")
        print(f"  Charts (matplotlib)      : {'✅ Available' if HAS_CHARTS else '⚠️ Not installed (run: pip install matplotlib)'}")
        print("────────────────────────────────────────────────────\n")
        return

    if args.test_email:
        log.info("Sending test email...")
        test_report = _build_test_report()
        html        = generate_html_email(test_report, config)
        send_email(html, config, "🧪 FlightWatch TEST Email")
        return

    log.info("══════════════════════════════════════════")
    log.info("  FlightWatch Pro — Starting price check")
    log.info("══════════════════════════════════════════")
    run_monitor(config, force_email=args.force_email)
    log.info("Run complete.\n")


if __name__ == "__main__":
    main()
