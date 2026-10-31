// extract.js
// Text extraction from uploaded screenshots (OCR) and PDFs.
// tesseract.js runs OCR in pure JS/WASM — no system Tesseract install needed.

import Tesseract from "tesseract.js";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

let worker = null;

async function getWorker() {
  if (!worker) {
    worker = await Tesseract.createWorker("eng");
  }
  return worker;
}

export async function extractTextFromImage(buffer) {
  const w = await getWorker();
  const {
    data: { text },
  } = await w.recognize(buffer);
  return text.trim();
}

export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return (data.text || "").trim();
}

export async function shutdownWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}