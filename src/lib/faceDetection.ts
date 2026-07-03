import { analyzeImageFromSource } from "./imageAnalysis";

export type FaceDetectionStatus = "idle" | "no-face" | "detected" | "multiple" | "low-light" | "blurry";

export interface FaceDetectionState {
  status: FaceDetectionStatus;
  message: string;
  faceBox?: { x: number; y: number; width: number; height: number };
}

type NativeFaceDetector = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

export async function detectFaceForScan(video: HTMLVideoElement): Promise<FaceDetectionState> {
  if (!video.videoWidth || !video.videoHeight) {
    return { status: "idle", message: "Starting camera..." };
  }

  const NativeDetector = (window as Window & { FaceDetector?: NativeFaceDetector }).FaceDetector;

  if (NativeDetector) {
    try {
      const faces = await new NativeDetector({ fastMode: true, maxDetectedFaces: 2 }).detect(video);
      if (faces.length > 1) return { status: "multiple", message: "We see more than one face. Scan one person at a time." };
      if (faces.length === 1) {
        const quality = await analyzeImageFromSource(video);
        if (quality.qualityDetail.lighting < 0.35) return { status: "low-light", message: "Lighting is too low. Move somewhere brighter and retake the scan." };
        if (quality.qualityDetail.blur < 0.2) return { status: "blurry", message: "The photo is too blurry to analyze. Hold still and try again." };
        const box = faces[0].boundingBox;
        return {
          status: "detected",
          message: "Face detected. Ready to scan.",
          faceBox: {
            x: box.x / video.videoWidth,
            y: box.y / video.videoHeight,
            width: box.width / video.videoWidth,
            height: box.height / video.videoHeight,
          },
        };
      }
    } catch {
      // Fall through to the local image-signal check below.
    }
  }

  const quality = await analyzeImageFromSource(video);
  if (!quality.faceDetected) {
    return { status: "no-face", message: "We could not clearly detect your face. Center your face and try again." };
  }
  if (quality.qualityDetail.lighting < 0.35) {
    return { status: "low-light", message: "Lighting is too low. Move somewhere brighter and retake the scan." };
  }
  if (quality.qualityDetail.blur < 0.2) {
    return { status: "blurry", message: "The photo is too blurry to analyze. Hold still and try again." };
  }
  return { status: "detected", message: "Face detected. Ready to scan." };
}

export const INITIAL_FACE_DETECTION: FaceDetectionState = {
  status: "idle",
  message: "Center your face in the frame. Laffy will take one photo to generate your skin analysis.",
};
