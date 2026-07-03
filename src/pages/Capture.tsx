import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Camera, CheckCircle2, ShieldCheck, Upload } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";
import { INITIAL_FACE_DETECTION, detectFaceForScan, type FaceDetectionState } from "@/lib/faceDetection";
import { loadImageFromFile, validateFile } from "@/lib/imageAnalysis";
import { analyzeSkinScan } from "@/lib/skinAnalysis";

export default function Capture() {
  const navigate = useNavigate();
  const { assessment, consent, setScan } = useAssessment();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [faceState, setFaceState] = useState<FaceDetectionState>(INITIAL_FACE_DETECTION);
  const [captureMessage, setCaptureMessage] = useState("Center your face in the frame. Laffy will take one photo to generate your skin analysis.");

  useEffect(() => {
    if (!consent.faceScan) return;
    let cancelled = false;
    let activeStream: MediaStream | null = null;

    (async () => {
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 960, height: 720 },
          audio: false,
        });
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = nextStream;
        setStream(nextStream);
        if (videoRef.current) {
          videoRef.current.srcObject = nextStream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError("Camera access was blocked. Upload a clear face photo to continue.");
        setFaceState({ status: "no-face", message: "Upload a centered face photo to begin." });
      }
    })();

    return () => {
      cancelled = true;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, [consent.faceScan]);

  useEffect(() => {
    if (!stream || cameraError) return;
    let cancelled = false;

    const checkFace = async () => {
      if (!videoRef.current || busy || cancelled) return;
      const next = await detectFaceForScan(videoRef.current);
      if (!cancelled) setFaceState(next);
    };

    void checkFace();
    const timer = window.setInterval(checkFace, 900);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stream, cameraError, busy]);

  if (!consent.faceScan) {
    return (
      <Layout>
        <section className="container-prose py-20">
          <div className="text-eyebrow">Consent required</div>
          <h1 className="font-display mt-2 text-4xl">Start with photo consent.</h1>
          <p className="mt-3 text-muted-foreground">The face scan is required for your Laffy AI skin analysis, and it only runs after explicit consent.</p>
          <Link to="/consent" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Go to consent</Link>
        </section>
      </Layout>
    );
  }

  const stopCamera = () => stream?.getTracks().forEach((track) => track.stop());

  const finishWith = async (source: HTMLImageElement | HTMLVideoElement) => {
    setBusy(true);
    setIssues([]);
    setCaptureMessage("Scan captured. Analyzing your skin...");
    try {
      const result = await analyzeSkinScan(source, assessment, {
        consentStatus: consent.faceScan,
        cloudAiConsent: consent.cloudAiAnalysis,
      });
      if (!result.faceDetected) {
        setIssues(["We could not clearly detect your face. Center your face and try again."]);
        setFaceState({ status: "no-face", message: "We could not clearly detect your face. Center your face and try again." });
        setCaptureMessage("Center your face in the frame. Laffy will take one photo to generate your skin analysis.");
        return;
      }
      if ((result.qualityDetail?.lighting ?? 1) < 0.35) {
        setIssues(["Lighting is too low. Move somewhere brighter and retake the scan."]);
        setFaceState({ status: "low-light", message: "Lighting is too low. Move somewhere brighter and retake the scan." });
        setCaptureMessage("Center your face in the frame. Laffy will take one photo to generate your skin analysis.");
        return;
      }
      if ((result.qualityDetail?.blur ?? 1) < 0.2) {
        setIssues(["The photo is too blurry to analyze. Try holding still and capturing again."]);
        setFaceState({ status: "blurry", message: "The photo is too blurry to analyze. Hold still and try again." });
        setCaptureMessage("Center your face in the frame. Laffy will take one photo to generate your skin analysis.");
        return;
      }
      setIssues(result.qualityDetail?.issues ?? []);
      setScan(result);
      stopCamera();
      navigate("/questionnaire");
    } catch {
      setIssues(["AI analysis failed. Try a clearer photo or refresh the page and scan again."]);
      setCaptureMessage("Center your face in the frame. Laffy will take one photo to generate your skin analysis.");
    } finally {
      setBusy(false);
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || faceState.status !== "detected") return;
    await finishWith(videoRef.current);
  };

  const onUpload = async (file: File) => {
    const valid = validateFile(file);
    if (!valid.ok) {
      setIssues([valid.reason ?? "Upload failed. Please try a JPG, PNG, or WebP photo."]);
      return;
    }
    try {
      const image = await loadImageFromFile(file);
      await finishWith(image);
    } catch {
      setIssues(["Upload failed. Please try a clear JPG, PNG, or WebP photo."]);
    }
  };

  const ready = faceState.status === "detected";

  return (
    <Layout>
      <section className="container-page py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <div className="text-eyebrow">AI Skin Scan</div>
            <h1 className="font-display mt-2 max-w-3xl text-4xl md:text-5xl">Center your face for an appearance-based skin analysis.</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Your photo is used to generate your skin analysis. See our{" "}
              <Link to="/legal/privacy-notice" className="underline underline-offset-4">Privacy Policy</Link>{" "}
              for details.
            </p>
            <p className="mt-3 max-w-2xl rounded-2xl bg-primary-soft p-4 text-sm text-accent-foreground">
              {captureMessage}
            </p>

            <div className="scan-card mt-8">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-muted">
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-warning" />
                    <span>{cameraError}</span>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
                    <div className="scan-vignette" />
                    <FaceGuide state={faceState} />
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <ScanStatus state={faceState} />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    disabled={!stream || busy || !ready}
                    className="cta-primary h-12 rounded-full px-7 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {busy ? <span className="h-4 w-4 rounded-full border border-primary-foreground/60 bg-secondary/80 shadow-soft animate-pulse" aria-hidden /> : <Camera className="h-4 w-4" />}
                    {busy ? "Scanning..." : "Capture Scan"}
                  </button>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-primary/60 bg-secondary-soft/55 p-6 text-center transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/55 hover:shadow-lift">
                <Upload className="h-6 w-6 text-foreground" />
                <span className="mt-3 font-extrabold">Upload a Clear Face Photo</span>
                <span className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  Use a well-lit photo with your face centered and uncovered. JPG, PNG, and WebP are supported.
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])}
                />
              </label>

              {issues.length > 0 && (
                <ul className="mt-4 rounded-2xl bg-secondary-soft p-4 text-sm text-secondary-foreground">
                  {issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              )}
            </div>
          </div>

          <aside className="surface-card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="font-display mt-5 text-2xl">What the scan reads</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Visible shine and T-zone reflectivity</li>
              <li>Texture and pore-looking patterns</li>
              <li>Visible redness and tone variation</li>
              <li>Spot contrast and blemish-prone zones</li>
              <li>Forehead, nose, cheek, chin, and under-eye differences</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-muted p-4 text-xs leading-5 text-muted-foreground">
              No facial recognition, identity matching, age, gender, ethnicity, emotion, or attractiveness scoring.
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

function FaceGuide({ state }: { state: FaceDetectionState }) {
  const box = state.faceBox;
  const style = box
    ? {
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
        transform: "none",
      }
    : undefined;

  return (
    <div
      className={`face-guide ${state.status === "detected" ? "face-guide-ready" : ""}`}
      style={style}
      aria-hidden
    />
  );
}

function ScanStatus({ state }: { state: FaceDetectionState }) {
  const ready = state.status === "detected";
  return (
    <div className={`inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm ${ready ? "bg-primary-soft text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
      {ready ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-warning" />}
      <span>{state.message}</span>
    </div>
  );
}
