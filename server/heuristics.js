// heuristics.js
// Fast, free, rule-based pre-check used as a fallback if the AI call fails.

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com",
  "protonmail.com", "aol.com", "icloud.com", "live.com", "yandex.com",
]);

const SUSPICIOUS_TLDS = [".xyz", ".top", ".club", ".info", ".click", ".online", ".site", ".biz", ".work"];

const PAYMENT_KEYWORDS = [
  "registration fee", "security deposit", "confirmation fee", "processing fee",
  "training kit", "pay ₹", "pay rs", "pay inr", "gpay", "upi id", "paytm",
  "transfer amount", "refundable deposit", "activation fee",
];

const URGENCY_KEYWORDS = [
  "within 30 minutes", "limited seats", "act now", "immediately", "urgent",
  "offer expires", "last date today", "hurry", "only few slots",
];

const KNOWN_BRANDS = ["microsoft", "google", "amazon", "infosys", "tcs", "wipro", "accenture", "meta", "apple"];

export function checkUrl(url) {
  const urlLower = url.toLowerCase().trim();
  let suspicious = false;
  let score = 0;
  let reason = "";

  if (SUSPICIOUS_TLDS.some((tld) => urlLower.endsWith(tld) || urlLower.includes(`${tld}/`))) {
    suspicious = true;
    score += 20;
    reason = "Domain uses an uncommon TLD often abused for scam sites.";
  }

  for (const brand of KNOWN_BRANDS) {
    if (urlLower.includes(brand) && !urlLower.includes(`${brand}.com`)) {
      suspicious = true;
      score += 30;
      reason = `URL references '${brand}' but does not match its official domain (${brand}.com) — a common brand-impersonation tactic.`;
      break;
    }
  }

  if (!reason) reason = "No obvious domain red flags found by the quick check — verify manually.";
  return { suspicious, reason, score };
}

export function heuristicScan(messageText, url = "") {
  const textLower = messageText.toLowerCase();
  const reasons = [];
  const indicators = [];
  let score = 0;

  for (const kw of PAYMENT_KEYWORDS) {
    if (textLower.includes(kw)) {
      reasons.push(`Mentions upfront payment language: '${kw}'`);
      indicators.push("Upfront Payment Request");
      score += 25;
      break;
    }
  }

  for (const kw of URGENCY_KEYWORDS) {
    if (textLower.includes(kw)) {
      reasons.push(`Uses urgency/pressure phrasing: '${kw}'`);
      indicators.push("Urgency Pressure Tactic");
      score += 15;
      break;
    }
  }

  const emailMatches = messageText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  for (const email of emailMatches) {
    const domain = email.split("@").pop().toLowerCase();
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      reasons.push(`Sender uses a free/generic email domain: ${domain}`);
      indicators.push("Generic Email Domain");
      score += 20;
      break;
    }
  }

  if (/₹\s?\d{2,6}|rs\.?\s?\d{2,6}|inr\s?\d{2,6}/i.test(textLower)) {
    reasons.push("Contains a specific rupee amount being requested");
    score += 10;
  }

  if (url) {
    const domainCheck = checkUrl(url);
    if (domainCheck.suspicious) {
      reasons.push(domainCheck.reason);
      indicators.push("Suspicious Domain");
      score += domainCheck.score;
    }
  }

  score = Math.min(score, 100);
  let level;
  if (score >= 86) level = "Critical";
  else if (score >= 66) level = "High";
  else if (score >= 41) level = "Medium";
  else if (score >= 21) level = "Low";
  else level = "Safe";

  if (reasons.length === 0) {
    reasons.push("No obvious red-flag keywords detected in a quick scan — verify independently.");
  }

  return {
    risk_score: score,
    risk_level: level,
    summary: `Rule-based scan found ${indicators.length} known scam pattern(s).`,
    reasons,
    suspicious_elements: [],
    safety_tips: [
      "Never pay money to confirm, secure, or activate a job/internship offer.",
      "Verify the company through its official careers page, not links sent to you.",
      "Search the recruiter's name and company together with the word 'scam'.",
    ],
    recommendation: [
      "Do NOT make any payment.",
      "Contact the company directly using contact details from their official website.",
      "Report the message to the platform (WhatsApp/Telegram/LinkedIn) if it's a scam.",
    ],
    scam_indicators: indicators,
    safe_alternatives: [
      "Legitimate employers never ask candidates to pay for an offer, training kit, or interview slot.",
    ],
  };
}