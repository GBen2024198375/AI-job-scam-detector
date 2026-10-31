import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ShieldCheck } from "lucide-react";
import Tabs from "./components/Tabs.jsx";
import ScanningCard from "./components/ScanningCard.jsx";
import VerdictPanel from "./components/VerdictPanel.jsx";
import TipsCard from "./components/TipsCard.jsx";
import { analyzeText, analyzeImage, analyzeUrl, analyzePdf } from "./api.js";

export default function App() {
  const [tab, setTab] = useState("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [history, setHistory] = useState([]);

  const [messageText, setMessageText] = useState("");
  const [urlHint, setUrlHint] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [urlInput, setUrlInput] = useState("");
  const [urlContext, setUrlContext] = useState("");

  const [pdfFile, setPdfFile] = useState(null);

  function finish(res, label) {
    setResult(res);
    setSourceLabel(label);
    setHistory((h) => [{ label, score: res.risk_score, level: res.risk_level }, ...h].slice(0, 6));
  }

  async function run(fn, label) {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fn();
      finish(res, label);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function downloadReport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify({ source: sourceLabel, result }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scam-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetToForm() {
    setResult(null);
    setError("");
  }

  return (
    <div className="page">
      <div className="shell">
        <motion.header
          className="top-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="app-bar-brand">
            <span className="brand-mark">
              <ShieldCheck size={20} />
            </span>
            <div>
              <div className="brand-title">AI Job Scam Detector</div>
              <div className="brand-sub">Internship &amp; job offer checker</div>
            </div>
          </div>

          <div className="top-headline">
            <h1>
              Find out if you're being <em>scammed</em>
            </h1>
            <p>Paste it, snap it, or link it — get a clear verdict in seconds.</p>
          </div>
        </motion.header>

        <main className="center-col">
          <Tabs active={tab} onChange={setTab} />

          <AnimatePresence mode="wait">
            {loading ? (
              <ScanningCard key="scanning" />
            ) : (
              !result && (
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {tab === "text" && (
                    <div className="panel">
                      <label>Content</label>
                      <textarea
                        rows={9}
                        placeholder={"Paste the message or email here…\n\nExample:\nCongratulations! You have been selected.\nPay ₹499 to confirm your internship.\nFrom: hr.microsoftcareers@gmail.com"}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <label>Links (optional)</label>
                      <input type="text" placeholder="https://..." value={urlHint} onChange={(e) => setUrlHint(e.target.value)} />
                      <button
                        className="btn-primary btn-block"
                        disabled={!messageText.trim()}
                        onClick={() => run(() => analyzeText(messageText, urlHint), "pasted message")}
                      >
                        Analyze message
                      </button>
                    </div>
                  )}

                  {tab === "image" && (
                    <div className="panel">
                      <label>Upload a WhatsApp / Gmail / Telegram screenshot</label>
                      <label className="dropzone">
                        <UploadCloud size={22} />
                        <span>{imageFile ? imageFile.name : "Click to choose an image"}</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                      </label>
                      {imagePreview && <img src={imagePreview} alt="preview" className="preview" />}
                      <button
                        className="btn-primary btn-block"
                        disabled={!imageFile}
                        onClick={() => run(() => analyzeImage(imageFile), "screenshot")}
                      >
                        Extract &amp; analyze
                      </button>
                    </div>
                  )}

                  {tab === "url" && (
                    <div className="panel">
                      <label>URL to check</label>
                      <input type="text" placeholder="www.microsoft-job-offer.xyz" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                      <label>Message text that came with it (optional)</label>
                      <textarea rows={6} value={urlContext} onChange={(e) => setUrlContext(e.target.value)} />
                      <button
                        className="btn-primary btn-block"
                        disabled={!urlInput.trim()}
                        onClick={() => run(() => analyzeUrl(urlInput, urlContext), "URL check")}
                      >
                        Check URL
                      </button>
                    </div>
                  )}

                  {tab === "pdf" && (
                    <div className="panel">
                      <label>Upload an offer letter or certificate (PDF)</label>
                      <label className="dropzone">
                        <UploadCloud size={22} />
                        <span>{pdfFile ? pdfFile.name : "Click to choose a PDF"}</span>
                        <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} hidden />
                      </label>
                      <button
                        className="btn-primary btn-block"
                        disabled={!pdfFile}
                        onClick={() => run(() => analyzePdf(pdfFile), "offer letter PDF")}
                      >
                        Extract &amp; analyze
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div className="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <VerdictPanel result={result} sourceLabel={sourceLabel} onDownload={downloadReport} onReset={resetToForm} />
            )}
          </AnimatePresence>

          {history.length > 0 && (
            <div className="history-strip">
              <span className="history-label">Recent checks</span>
              <div className="history-chips">
                <AnimatePresence initial={false}>
                  {history.map((h, i) => (
                    <motion.span
                      key={h.label + i + h.score}
                      className={`chip-history badge-${(h.level || "").toLowerCase()}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {h.label} · {h.score}%
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        <TipsCard />

        <footer>
          This tool assists judgment — it doesn't replace verifying an offer directly with the company through its official channels.
        </footer>
      </div>
    </div>
  );
}