// Browser-side cosmetic image analysis.
// Pure Canvas/pixel math. No biometric templates, no facial recognition,
// no identity, age, gender, ethnicity, or emotion inference.
// Outputs are approximate visual signals only.

import type { ScanSignals } from "./recommendation";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

export interface ImageQuality {
  lighting: number;       // 0..1
  blur: number;           // 0..1 (1 = very sharp)
  framing: number;        // 0..1 (proxy: center brightness > edges)
  overexposed: boolean;
  overall: number;        // 0..1
  reliable: boolean;
  issues: string[];
}

export interface AnalysisResult extends ScanSignals {
  quality: number;
  qualityDetail: ImageQuality;
}

export function validateFile(file: File): { ok: boolean; reason?: string } {
  if (!ACCEPTED_MIME.includes(file.type)) return { ok: false, reason: "Please upload a JPG, PNG, or WebP photo." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "Photo is larger than 12 MB." };
  return { ok: true };
}

export async function analyzeImageFromSource(src: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<AnalysisResult> {
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  return analyzePixels(data);
}

export function analyzePixels(img: ImageData): AnalysisResult {
  const { data, width, height } = img;
  let sumL = 0, sumL2 = 0, count = 0;
  let centerL = 0, centerCount = 0, edgeL = 0, edgeCount = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  let sumRedness = 0;
  let overexposedPx = 0;
  // For variance / dark spots, sample skin-tone-ish pixels only (broad cosmetic filter).
  const skinLuminance: number[] = [];
  // Laplacian variance (blur proxy) on grayscale
  let lapSum = 0, lapSum2 = 0, lapCount = 0;
  const gray = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b; // 0..255
      gray[y * width + x] = lum;
      sumL += lum; sumL2 += lum * lum; count++;
      sumR += r; sumG += g; sumB += b;
      if (lum > 245) overexposedPx++;
      const cx = width / 2, cy = height / 2;
      const distNorm = Math.hypot(x - cx, y - cy) / (Math.hypot(cx, cy));
      if (distNorm < 0.4) { centerL += lum; centerCount++; }
      else if (distNorm > 0.7) { edgeL += lum; edgeCount++; }

      // Broad cosmetic skin-tone heuristic — works across skin tones, not identity.
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const isSkinish = r > 60 && g > 30 && b > 15 && (max - min) > 8 && r >= g && g >= b * 0.6 && lum > 40 && lum < 235;
      if (isSkinish) {
        skinLuminance.push(lum);
        // Redness proxy: r relative to average of g,b
        const redness = (r - (g + b) / 2) / 255;
        sumRedness += Math.max(0, redness);
      }
    }
  }

  // Laplacian variance for blur
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = -gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width] + 4 * gray[i];
      lapSum += lap; lapSum2 += lap * lap; lapCount++;
    }
  }
  const meanL = sumL / count;
  const varL = sumL2 / count - meanL * meanL;
  const skinPx = skinLuminance.length;

  // Lighting: ideal mean 90..170, penalize extremes.
  const lightingScore = clamp01(1 - Math.abs(meanL - 130) / 130);
  // Overexposure
  const overFrac = overexposedPx / count;
  const overexposed = overFrac > 0.06;
  // Blur: Laplacian variance — higher is sharper. Normalize.
  const lapMean = lapSum / lapCount;
  const lapVar = lapSum2 / lapCount - lapMean * lapMean;
  const blurScore = clamp01(lapVar / 1500);
  // Framing: center brighter / better lit than edges (face in middle)
  const cAvg = centerCount ? centerL / centerCount : 0;
  const eAvg = edgeCount ? edgeL / edgeCount : 1;
  const framingScore = clamp01((cAvg - eAvg + 30) / 80);

  const skinFrac = skinPx / count;
  const skinEnough = skinFrac > 0.08; // need at least ~8% skinish pixels

  // Shine proxy: fraction of skin pixels with very high luminance
  let shineHi = 0;
  for (const v of skinLuminance) if (v > 215) shineHi++;
  const shine = clamp01(skinPx ? (shineHi / skinPx) * 4 : 0);

  // Redness proxy
  const redness = clamp01(skinPx ? (sumRedness / skinPx) * 6 : 0);

  // Texture variance proxy: stdev of skin luminance, normalized
  let mean = 0; for (const v of skinLuminance) mean += v; mean /= Math.max(1, skinPx);
  let sq = 0; for (const v of skinLuminance) sq += (v - mean) * (v - mean);
  const stdev = Math.sqrt(sq / Math.max(1, skinPx));
  const texture = clamp01((stdev - 8) / 30);

  // Dark spot proxy: fraction of skin pixels significantly below the mean
  let darkN = 0; for (const v of skinLuminance) if (v < mean - 22) darkN++;
  const darkSpots = clamp01(skinPx ? (darkN / skinPx) * 5 : 0);

  const issues: string[] = [];
  if (!skinEnough) issues.push("We could not detect enough of your face — try better lighting and centering.");
  if (lightingScore < 0.5) issues.push("Lighting looks uneven. Try a soft, front-facing light source.");
  if (blurScore < 0.35) issues.push("Photo looks a bit blurry. Hold the camera steady.");
  if (framingScore < 0.4) issues.push("Center your face in the frame.");
  if (overexposed) issues.push("Photo is overexposed in places — move away from bright direct light.");

  const overall = clamp01(0.3 * lightingScore + 0.3 * blurScore + 0.2 * framingScore + 0.2 * (skinEnough ? 1 : 0) - (overexposed ? 0.15 : 0));
  const reliable = overall > 0.55 && skinEnough && !overexposed;

  const qualityDetail: ImageQuality = {
    lighting: r2(lightingScore),
    blur: r2(blurScore),
    framing: r2(framingScore),
    overexposed,
    overall: r2(overall),
    reliable,
    issues,
  };

  return {
    quality: r2(overall),
    shine: r2(shine),
    redness: r2(redness),
    texture: r2(texture),
    darkSpots: r2(darkSpots),
    reliable,
    faceDetected: skinEnough,
    qualityDetail,
  };
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function r2(n: number) { return Math.round(n * 100) / 100; }

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
