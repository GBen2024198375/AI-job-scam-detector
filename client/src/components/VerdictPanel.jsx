import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldAlert,
  ShieldX,
  ListChecks,
  Flag,
  TriangleAlert,
  CircleCheck,
  Lightbulb,
  Compass,
  Download,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

const LEVEL_META = {
  Safe: {
    tone: "safe",
    Icon: CheckCircle2,
    headline: "This looks safe",
    sub: "No strong scam indicators were found — still worth a quick common-sense check.",
  },
  Low: {
    tone: "safe",
    Icon: CheckCircle2,
    headline: "Looks mostly fine",
    sub: "Only minor concerns turned up. Proceed with normal caution.",
  },
  Medium: {
    tone: "warn",
    Icon: ShieldAlert,
    headline: "Verify before proceeding",
    sub: "Several things here are worth confirming independently before you continue.",
  },
  High: {
    tone: "danger",
    Icon: ShieldX,
    headline: "This looks like a scam",
    sub: "Strong scam indicators were found. Don't send money or personal information.",
  },
  Critical: {
    tone: "danger",
    Icon: ShieldX,
    headline: "This is almost certainly a scam",
    sub: "This matches known scam patterns closely. Do not engage further.",
  },
};

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const itemVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

function Section({ title, items, Icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="detail-section">
      <h4>
        <Icon size={14} strokeWidth={2.4} />
        {title}
      </h4>
      <motion.ul variants={listVariants} initial="hidden" animate="show">
        {items.map((item, i) => (
          <motion.li key={i} variants={itemVariants}>
            {item}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

export default function VerdictPanel({ result, sourceLabel, onDownload, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const level = result.risk_level || "Medium";
  const meta = LEVEL_META[level] || LEVEL_META.Medium;
  const score = result.risk_score ?? 50;
  const animatedScore = useCountUp(score);
  const HeadlineIcon = meta.Icon;

  const topFlags = (result.scam_indicators || []).slice(0, 4);

  return (
    <motion.div
      className="result-wrap"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className={`result-card tone-${meta.tone}`}>
        <motion.div
          className="result-badge"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
        >
          <HeadlineIcon size={34} strokeWidth={2} />
        </motion.div>

        <div className="result-score">{animatedScore}%</div>
        <h2 className="result-headline">{meta.headline}</h2>
        <p className="result-sub">{result.summary || meta.sub}</p>

        {topFlags.length > 0 && (
          <div className="flag-row">
            {topFlags.map((f, i) => (
              <span key={i} className="flag-pill">
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="meta-line-light">
          source: {sourceLabel}
          {result._source === "heuristic_fallback" && <> &middot; offline quick-scan mode</>}
        </div>

        {result._source === "heuristic_fallback" && (
          <div className="notice-light">
            AI service unavailable — this is a rule-based quick scan.
            {result._error ? ` (${result._error})` : ""}
          </div>
        )}

        <div className="result-actions">
          <button className="btn-primary" onClick={onDownload}>
            <Download size={15} />
            Download report
          </button>
          {onReset && (
            <button className="btn-secondary" onClick={onReset}>
              <RotateCcw size={14} />
              Check another
            </button>
          )}
        </div>

        <button className="btn-link" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Hide full analysis" : "View full analysis"}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={15} />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="detail-card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="detail-inner">
              <Section title="Reasons" items={result.reasons} Icon={ListChecks} />
              <Section title="Suspicious elements" items={result.suspicious_elements} Icon={Flag} />
              <Section title="Scam indicators" items={result.scam_indicators} Icon={TriangleAlert} />
              <Section title="Recommendation" items={result.recommendation} Icon={CircleCheck} />
              <Section title="Safety tips" items={result.safety_tips} Icon={Lightbulb} />
              <Section title="What a safe process looks like" items={result.safe_alternatives} Icon={Compass} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}