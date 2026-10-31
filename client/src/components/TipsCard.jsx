import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lightbulb } from "lucide-react";

const TIPS = [
  "Be cautious with urgent requests to pay or share details quickly.",
  "Avoid clicking links from unknown or unofficial senders.",
  "Never share personal or financial details until you're sure.",
  "Verify any offer directly on the company's official careers page.",
];

export default function TipsCard() {
  return (
    <motion.section
      className="tips-bar"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="tips-bar-head">
        <ShieldCheck size={18} />
        <span>Stay safe, stay aware</span>
      </div>
      <ul className="tips-grid">
        {TIPS.map((t) => (
          <li key={t}>
            <Lightbulb size={14} className="tips-bullet" />
            {t}
          </li>
        ))}
      </ul>
      <p className="tips-tagline">Together for a safer job hunt.</p>
    </motion.section>
  );
}