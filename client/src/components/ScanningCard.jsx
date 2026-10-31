import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Check } from "lucide-react";

const STEPS = [
  "Checking sender details",
  "Analyzing message content",
  "Scanning links & domains",
  "Matching known scam patterns",
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScanningCard() {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < 92 ? Math.min(92, p + Math.random() * 6 + 2) : p));
    }, 260);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(progress);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const stepsDone = Math.min(STEPS.length, Math.floor((pct / 92) * STEPS.length));

  return (
    <motion.div
      className="scan-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="scan-ring-wrap">
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle cx="66" cy="66" r={RADIUS} className="scan-ring-track" />
          <circle
            cx="66"
            cy="66"
            r={RADIUS}
            className="scan-ring-progress"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 66 66)"
          />
        </svg>
        <div className="scan-ring-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          >
            <Search size={22} className="scan-icon" />
          </motion.div>
          <span className="scan-pct">{pct}%</span>
        </div>
      </div>

      <div className="scan-title">Scanning your submission…</div>
      <p className="scan-sub">
        Checking for spam indicators, suspicious links, and known scam patterns.
      </p>

      <ul className="scan-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < stepsDone ? "scan-step-done" : ""}>
            <span className="scan-step-dot">{i < stepsDone && <Check size={12} strokeWidth={3} />}</span>
            {s}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}