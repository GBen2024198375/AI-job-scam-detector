import React from "react";
import { motion } from "framer-motion";
import { MessageSquareText, ScanText, Link2, FileText } from "lucide-react";

const TABS = [
  { id: "text", label: "Message", Icon: MessageSquareText },
  { id: "image", label: "Screenshot", Icon: ScanText },
  { id: "url", label: "URL", Icon: Link2 },
  { id: "pdf", label: "Offer Letter", Icon: FileText },
];

export default function Tabs({ active, onChange }) {
  return (
    <div className="tabs">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? "tab-active" : ""}`}
          onClick={() => onChange(id)}
        >
          {active === id && (
            <motion.div
              className="tab-pill-bg"
              layoutId="tab-pill-bg"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <span className="tab-content">
            <Icon size={15} strokeWidth={2} />
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}