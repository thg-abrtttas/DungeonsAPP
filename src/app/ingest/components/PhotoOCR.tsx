'use client';

import React from 'react';
import { useState, useRef, useCallback } from 'react';
import { Camera, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Trash2, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { recognizeImage, preprocessImage, fileToDataURL, initializeOCR, terminateOCR } from '@/lib/ocr/ocrClient';

interface PhotoOCRProps {
  onTextExtracted: (text: string) => void;
  onImageChange?: (url: string | null) => void;
}

export function PhotoOCR({ onTextExtracted, onImageChange }: PhotoOCRProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ocrReady, setOcrReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize OCR on mount
  React.useEffect(() => {
    initializeOCR().then(() => setOcrReady(true)).catch(() => setOcrReady(true));
    return () => { /* Don't terminate - keep worker alive for session */ };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      fileToDataURL(file).then(url => {
        setImagePreview(url);
        onImageChange?.(url);
      });
      setExtractedText('');
      setError(null);
    }
  }, [onImageChange]);

  const handleCameraCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedText('');
    setError(null);
    onImageChange?.(null);
  }, [onImageChange]);

  const handleRotate = useCallback(async () => {
    if (!canvasRef.current || !imagePreview) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const newDataUrl = canvas.toDataURL('image/png');
      setImagePreview(newDataUrl);
      onImageChange?.(newDataUrl);
    };
    img.src = imagePreview;
  }, [imagePreview, onImageChange]);

  const handleDownloadImage = useCallback(() => {
    if (!imagePreview) return;
    const a = document.createElement('a');
    a.href = imagePreview;
    a.download = 'character-sheet.png';
    a.click();
  }, [imagePreview]);

  const handleOCR = useCallback(async () => {
    if (!imageFile || processing) return;

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Preprocess image for better OCR
      setProgress(10);
      const canvas = await preprocessImage(imageFile);

      // Recognize text
      const result = await recognizeImage(canvas, {
        onProgress: (p) => setProgress(10 + Math.round(p * 80)),
      });

      setProgress(95);
      setExtractedText(result.text);
      onTextExtracted(result.text);

      if (result.confidence < 50) {
        setError('Low confidence OCR result. Please review and edit the text before parsing.');
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError(err instanceof Error ? err.message : 'OCR failed. Try a clearer photo or use text input.');
    } finally {
      setProcessing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [imageFile, processing, onTextExtracted]);

  const handleUseText = useCallback(() => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText);
    }
  }, [extractedText, onTextExtracted]);

  return (
    <div className="space-y-6">
      {/* Camera/Upload Area */}
      <Card variant="parchment" padding="lg">
        <div className="space-y-4">
          {!imagePreview ? (
            <div className="border-2 border-dashed border-ink-300 rounded-xl p-8 text-center hover:border-candlelight-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="sr-only"
                disabled={processing}
              />
              <label htmlFor="photo-input" className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto text-ink-300 mb-3" />
                <p className="text-ink-600 mb-1">Tap to take photo or select image</p>
                <p className="text-sm text-ink-400">Works best: flat, well-lit, entire sheet visible</p>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-[3/4] max-h-[500px] overflow-hidden rounded-lg border border-ink-200 bg-parchment-100">
                <img
                  src={imagePreview}
                  alt="Character sheet preview"
                  className="w-full h-full object-contain p-2"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Image Controls */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="secondary" size="sm" onClick={handleRotate} disabled={processing}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Rotate
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadImage} disabled={processing}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRemoveImage} disabled={processing}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* OCR Action */}
          {imagePreview && (
            <div className="space-y-3 pt-4 border-t border-ink-200">
              <Button
                onClick={handleOCR}
                disabled={processing || !ocrReady}
                size="lg"
                className="w-full"
                loading={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {progress > 0 ? `Processing... ${progress}%` : 'Initializing OCR...'}
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Extract Text (OCR)
                  </>
                )}
              </Button>

              {!ocrReady && !processing && (
                <p className="text-xs text-ink-500 text-center">Loading OCR engine... (first time only)</p>
              )}

              {error && (
                <div className="p-3 bg-ink-100 border border-ink-300 rounded-lg text-ink-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-ink-600 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Extracted Text Review */}
      {extractedText && (
        <Card variant="parchment" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-candlelight-600" />
                Extracted Text
              </span>
              <span className="text-sm text-ink-500">{extractedText.length} characters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <textarea
                value={extractedText}
                onChange={e => setExtractedText(e.target.value)}
                readOnly
                className="w-full h-48 font-mono text-sm bg-parchment-50 border border-ink-200 rounded-lg p-3 resize-none text-ink-800"
                placeholder="Extracted text will appear here..."
              />
              <div className="absolute bottom-2 right-2">
                <Button size="sm" onClick={handleUseText} variant="primary">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Use This Text
                </Button>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-2 text-center">
              Review the text above. OCR isn't perfect — you can edit it in the next step.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card variant="parchment" padding="md" className="bg-candlelight-50 border-candlelight-200">
        <h4 className="font-bold text-ink-900 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-candlelight-600" />
          Tips for Better OCR
        </h4>
        <ul className="space-y-1 text-sm text-ink-600">
          <li className="flex items-start gap-2"><span className="text-candlelight-600 mt-0.5">•</span> Good lighting — natural light or bright lamp, no shadows</li>
          <li className="flex items-start gap-2"><span className="text-candlelight-600 mt-0.5">•</span> Flat surface — avoid curved pages or wrinkled paper</li>
          <li className="flex items-start gap-2"><span className="text-candlelight-600 mt-0.5">•</span> Fill frame — get the whole sheet in the shot, not too close</li>
          <li className="flex items-start gap-2"><span className="text-candlelight-600 mt-0.5">•</span> High contrast — printed sheets work better than handwritten</li>
          <li className="flex items-start gap-2"><span className="text-candlelight-600 mt-0.5">•</span> If OCR fails: Use "Paste Text" and copy from Google Lens / Live Text</li>
        </ul>
      </Card>
    </div>
  );
}