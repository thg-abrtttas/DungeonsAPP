/**
 * OCR Client - Tesseract.js wrapper for character sheet text extraction
 * Runs entirely in browser via WebAssembly - free, offline-capable once loaded
 */

import { createWorker, PSM, OEM } from 'tesseract.js';

let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
let workerLoading: Promise<void> | null = null;

export interface OCRResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export async function initializeOCR(): Promise<void> {
  if (worker) return;
  if (workerLoading) return workerLoading;

  workerLoading = (async () => {
    worker = await createWorker('eng');

    // Set up logger
    (worker as any).setLogger?.((m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    });

    // Set parameters for better character sheet recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;-()+/\'"@#$%&*!? ',
      preserve_interword_spaces: '1',
      oem: OEM.LSTM_ONLY,
      psm: PSM.AUTO,
    });
  })();

  return workerLoading;
}

export async function recognizeImage(
  imageSource: string | HTMLImageElement | HTMLCanvasElement | File | Blob,
  options?: { language?: string; onProgress?: (progress: number) => void }
): Promise<OCRResult> {
  await initializeOCR();
  if (!worker) throw new Error('OCR worker not initialized');

  const result = await worker.recognize(imageSource);
  const data = result.data;

  return {
    text: data.text,
    confidence: data.confidence,
    lines: (data as any).lines?.map((line: any) => ({
      text: line.text,
      confidence: line.confidence,
      bbox: line.bbox,
    })) || [],
  };
}

export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    workerLoading = null;
  }
}

// Helper to convert file to data URL for preview
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Preprocess image for better OCR (canvas-based)
export async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale up small images for better OCR
      const maxDim = 2000;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width *= scale;
        height *= scale;
      } else if (width < 1000 && height < 1000) {
        // Scale up small images
        const scale = Math.max(1000 / width, 1000 / height, 1);
        width *= scale;
        height *= scale;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Enhance contrast
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast
        const factor = 1.3;
        data[i] = Math.min(255, data[i] * factor);       // R
        data[i + 1] = Math.min(255, data[i + 1] * factor); // G
        data[i + 2] = Math.min(255, data[i + 2] * factor); // B
      }
      ctx.putImageData(imageData, 0, 0);

      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}