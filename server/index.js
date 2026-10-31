import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

import { analyzeWithAI } from "./aiService.js";
import { extractTextFromImage, extractTextFromPdf, shutdownWorker } from "./extract.js";
import { checkUrl } from "./heuristics.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENROUTER_API_KEY) });
});

// 1. Paste message / email
app.post("/api/analyze/text", async (req, res) => {
  try {
    const { text, url } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Please provide message text to analyze." });
    }
    const result = await analyzeWithAI(text, { url, contextLabel: "pasted message or email" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Screenshot upload (OCR)
app.post("/api/analyze/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Please upload a screenshot." });
    const extractedText = await extractTextFromImage(req.file.buffer);
    if (!extractedText) {
      return res.status(422).json({ error: "Couldn't extract any text from this image. Try a clearer screenshot." });
    }
    const result = await analyzeWithAI(extractedText, { contextLabel: "screenshot (OCR extracted)" });
    res.json({ ...result, extractedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. URL check
app.post("/api/analyze/url", async (req, res) => {
  try {
    const { url, context } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: "Please provide a URL to check." });
    }
    const quickCheck = checkUrl(url);
    const result = await analyzeWithAI(
      context && context.trim() ? context : "No accompanying message text was provided — evaluate the URL alone.",
      { url, contextLabel: "job offer URL" }
    );
    res.json({ ...result, quickCheck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Offer letter / certificate PDF
app.post("/api/analyze/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Please upload a PDF." });
    const extractedText = await extractTextFromPdf(req.file.buffer);
    if (!extractedText) {
      return res.status(422).json({ error: "Couldn't extract text — this may be a scanned/image-only PDF." });
    }
    const result = await analyzeWithAI(extractedText, { contextLabel: "offer letter / certificate PDF" });
    res.json({ ...result, extractedText });
  } catch (err) {
    console.error("PDF parse error:", err.message);
    res.status(422).json({
      error: "This PDF couldn't be read — it may be corrupted, scanned as images, or exported in a non-standard format. Try a different file, or re-save/print it as a new PDF first.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  await shutdownWorker();
  process.exit(0);
});