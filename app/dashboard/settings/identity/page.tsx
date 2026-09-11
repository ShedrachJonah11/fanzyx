"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/services/context";
import { identity as identityApi } from "@/services/modules/identity";
import { uploadFile } from "@/services/modules/uploads";
import { ApiError } from "@/services/apiClient";
import type {
  IdentityDocumentType,
  IdentityOut,
  IdentityStatus,
  IdentitySubmitIn,
} from "@/services/dtos";
import { cn } from "@/lib/utils";

/* ── Options ─────────────────────────────────────────────── */

// FanzyX currently supports Nigeria only for identity verification.
const COUNTRY_CODE = "NG";
const COUNTRY_LABEL = "Nigeria";

const ID_TYPES: {
  value: IdentityDocumentType;
  label: string;
  needsBack: boolean;
  needsPhoto: boolean;
  numberLabel: string;
  numberHint: string;
}[] = [
  {
    value: "bvn",
    label: "Bank Verification Number (BVN)",
    needsBack: false,
    needsPhoto: false,
    numberLabel: "BVN",
    numberHint: "11 digits",
  },
  {
    value: "nin",
    label: "National Identification Number",
    needsBack: true,
    needsPhoto: true,
    numberLabel: "NIN",
    numberHint: "11 digits",
  },
  {
    value: "drivers_license",
    label: "Driver's License",
    needsBack: true,
    needsPhoto: true,
    numberLabel: "License number",
    numberHint: "As shown on the card",
  },
  {
    value: "passport",
    label: "International Passport",
    needsBack: false,
    needsPhoto: true,
    numberLabel: "Passport number",
    numberHint: "9-character alphanumeric",
  },
];

/* ── Page ────────────────────────────────────────────────── */

type Step = "identity" | "face";

export default function IdentityVerificationPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [initialLoading, setInitialLoading] = useState(true);
  const [server, setServer] = useState<IdentityOut | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await identityApi.get();
        if (cancelled) return;
        setServer(res);
      } catch {
        // Backend endpoint not live yet — fall back to what MeOut tells us.
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const status: IdentityStatus =
    server?.status ?? user?.identityStatus ?? "none";

  /* Step + form state */
  const [step, setStep] = useState<Step>("identity");
  const [documentType, setDocumentType] =
    useState<IdentityDocumentType | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [idFront, setIdFront] = useState<UploadedDoc | null>(null);
  const [idBack, setIdBack] = useState<UploadedDoc | null>(null);
  const [selfie, setSelfie] = useState<UploadedDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const idMeta = ID_TYPES.find((t) => t.value === documentType) ?? null;

  const step1Valid = !!(
    documentType &&
    idNumber.trim().length >= 6 &&
    (!idMeta?.needsPhoto || idFront?.mediaId) &&
    (!idMeta?.needsBack || idBack?.mediaId)
  );

  const canSubmit = step1Valid && !!selfie?.mediaId && !submitting;

  const submit = async () => {
    if (!canSubmit || !documentType) return;
    setSubmitting(true);
    try {
      const dto: IdentitySubmitIn = {
        country: COUNTRY_CODE,
        documentType,
        idNumber: idNumber.trim(),
        idFrontMediaId: idFront?.mediaId,
        idBackMediaId: idBack?.mediaId,
        selfieMediaId: selfie!.mediaId!,
      };
      const res = await identityApi.submit(dto);
      setServer(res);
      toast.success("Submitted — we'll review within 24 hours");
      // Pull the fresh identityStatus into the auth session.
      refresh?.();
      router.replace("/dashboard/settings/identity");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "already_submitted")
          toast.error("You've already submitted — check back soon.");
        else if (e.code === "creator_required")
          toast.error("Only creators can request verification.");
        else if (e.code === "age_under_18")
          toast.error("You must be 18 or older to verify.");
        else if (e.code === "id_number_taken")
          toast.error(
            "That ID number is already registered to another account. Double-check the number, or contact support if this is yours."
          );
        else if (e.code === "rate_limited" || e.status === 429)
          toast.error(
            "Too many submissions today. Try again in 24 hours."
          );
        else if (e.code === "media_not_ready" || e.code === "media_not_owned")
          toast.error("One of your uploads isn't ready. Try again.");
        else if (e.code === "invalid_document")
          toast.error(e.detail ?? "Please check the document details.");
        else toast.error(e.detail ?? e.message);
      } else {
        toast.error("Couldn't submit — please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* Status card branch — pending/verified/rejected show status, not the wizard */
  if (initialLoading) {
    return (
      <DashboardShell title="Get Verified" subtitle="Verification requests take within 24 hours.">
        <div className="flex flex-col gap-4 max-w-3xl">
          <Skeleton className="h-24 rounded-[14px]" />
          <Skeleton className="h-64 rounded-[14px]" />
        </div>
      </DashboardShell>
    );
  }

  if (status === "verified" || status === "pending") {
    return (
      <DashboardShell
        title="Get Verified"
        subtitle="Verification requests take within 24 hours."
      >
        <StatusCard status={status} server={server} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Get Verified"
      subtitle="Verification requests take within 24 hours."
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        {status === "rejected" && server?.rejectionReason ? (
          <div className="rounded-[14px] hairline bg-red-500/10 text-red-200 px-4 py-3 text-sm flex items-start gap-3">
            <ShieldX className="size-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-red-100">
                Your last submission was rejected
              </div>
              <div className="mt-0.5 text-red-200/85">
                {server.rejectionReason}
              </div>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="inline-flex items-center gap-1 self-start rounded-[14px] bg-white/[0.04] hairline p-1">
          <StepTab
            active={step === "identity"}
            complete={step1Valid}
            onClick={() => setStep("identity")}
          >
            Authenticating Identity
          </StepTab>
          <StepTab
            active={step === "face"}
            complete={!!selfie?.mediaId}
            disabled={!step1Valid}
            onClick={() => step1Valid && setStep("face")}
          >
            Face Capture
          </StepTab>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-6">
            {step === "identity" ? (
              <StepIdentity
                documentType={documentType}
                setDocumentType={setDocumentType}
                idMeta={idMeta}
                idNumber={idNumber}
                setIdNumber={setIdNumber}
                idFront={idFront}
                setIdFront={setIdFront}
                idBack={idBack}
                setIdBack={setIdBack}
                onContinue={() => step1Valid && setStep("face")}
                canContinue={step1Valid}
              />
            ) : (
              <StepFace
                selfie={selfie}
                setSelfie={setSelfie}
                onBack={() => setStep("identity")}
                onSubmit={submit}
                submitting={submitting}
                canSubmit={canSubmit}
              />
            )}
          </CardBody>
        </Card>

        <div className="text-right text-[12px] text-white/55">
          Not ready for this step?{" "}
          <Link
            href="/dashboard"
            className="text-[#FD5CC9] font-semibold hover:text-white"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Step 1: Identity ───────────────────────────────────── */

function StepIdentity({
  documentType,
  setDocumentType,
  idMeta,
  idNumber,
  setIdNumber,
  idFront,
  setIdFront,
  idBack,
  setIdBack,
  onContinue,
  canContinue,
}: {
  documentType: IdentityDocumentType | "";
  setDocumentType: (v: IdentityDocumentType) => void;
  idMeta: (typeof ID_TYPES)[number] | null;
  idNumber: string;
  setIdNumber: (v: string) => void;
  idFront: UploadedDoc | null;
  setIdFront: (v: UploadedDoc | null) => void;
  idBack: UploadedDoc | null;
  setIdBack: (v: UploadedDoc | null) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <>
      <div className="mt-2">
        <h2 className="text-[16px] font-semibold text-white">
          Authenticating Identity
        </h2>
        <p className="text-[12px] text-white/55 mt-1">
          Once you are verified you will receive a badge.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-white/70">Country</span>
          <div className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline flex items-center px-4 text-[14px] text-white/85">
            {COUNTRY_LABEL}
          </div>
          <span className="text-[11px] text-white/45">
            Only Nigeria is supported right now.
          </span>
        </div>
        <Select
          label="Identity"
          placeholder="Select identity"
          value={documentType}
          onChange={(v) => setDocumentType(v as IdentityDocumentType)}
          options={ID_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      {idMeta ? (
        <div className="flex flex-col gap-4">
          <Input
            label={idMeta.numberLabel}
            hint={idMeta.numberHint}
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={`Enter your ${idMeta.numberLabel.toLowerCase()}`}
            inputMode={idMeta.value === "passport" ? "text" : "numeric"}
            autoComplete="off"
          />

          {idMeta.needsPhoto ? (
            <div
              className={cn(
                "grid gap-4",
                idMeta.needsBack ? "sm:grid-cols-2" : ""
              )}
            >
              <CameraCapture
                label="ID photo (front)"
                mode="document"
                doc={idFront}
                onChange={setIdFront}
              />
              {idMeta.needsBack ? (
                <CameraCapture
                  label="ID photo (back)"
                  mode="document"
                  doc={idBack}
                  onChange={setIdBack}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </>
  );
}

/* ── Step 2: Face capture ───────────────────────────────── */

function StepFace({
  selfie,
  setSelfie,
  onBack,
  onSubmit,
  submitting,
  canSubmit,
}: {
  selfie: UploadedDoc | null;
  setSelfie: (v: UploadedDoc | null) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
}) {
  return (
    <>
      <div className="mt-2">
        <h2 className="text-[16px] font-semibold text-white">Face Capture</h2>
        <p className="text-[12px] text-white/55 mt-1">
          Take a clear selfie in good lighting. No hats or sunglasses.
        </p>
      </div>

      <div className="mt-2">
        <CameraCapture
          label=""
          mode="selfie"
          doc={selfie}
          onChange={setSelfie}
          aspect="square"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {submitting ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </>
  );
}

/* ── Bits ───────────────────────────────────────────────── */

type UploadedDoc = {
  previewUrl: string;
  mediaId?: string;
  progress: number;
  error?: string;
};

type CameraMode = "selfie" | "document";
type CameraAspect = "square" | "3-2";

/**
 * Live-capture-only uploader. No file picker: users must use the camera
 * so ID docs and selfies are captured on the same device that's signed in.
 * `mode="selfie"` uses front camera (`facingMode: user`).
 * `mode="document"` prefers back camera on mobile (`facingMode: environment`)
 *  and falls back to whatever's available on desktop.
 */
function CameraCapture({
  label,
  mode,
  doc,
  onChange,
  aspect = "3-2",
}: {
  label: string;
  mode: CameraMode;
  doc: UploadedDoc | null;
  onChange: (v: UploadedDoc | null) => void;
  aspect?: CameraAspect;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const cameraReady = !!stream;

  const facingMode: "user" | "environment" =
    mode === "selfie" ? "user" : "environment";

  const stopCamera = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(s);
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "Camera permission denied. Enable it in your browser to continue."
          : "Couldn't access the camera. Try a different device or browser.";
      setCameraError(msg);
    } finally {
      setStarting(false);
    }
  }, [starting, facingMode]);

  // Attach the stream to the <video> whenever both are ready. The video
  // element is always mounted, so ref is guaranteed here — this fixes the
  // "black preview" bug where srcObject was set before the video mounted.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {
      // Autoplay may be blocked in rare cases; the user can click into the
      // frame to trigger playback.
    });
    return () => {
      if (el.srcObject === stream) el.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const uploadBlob = useCallback(
    async (blob: Blob, previewUrl: string) => {
      const file = new File([blob], `${mode}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onChange({ previewUrl, progress: 0 });
      try {
        const res = await uploadFile(file, "identity", (loaded, total) => {
          onChange({
            previewUrl,
            progress: total ? loaded / total : 0,
          });
        });
        onChange({
          previewUrl,
          mediaId: res.mediaId,
          progress: 1,
        });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.detail ?? err.message
            : err instanceof Error
            ? err.message
            : "Upload failed";
        onChange({ previewUrl, progress: 0, error: msg });
        toast.error(msg);
      }
    },
    [mode, onChange]
  );

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const previewUrl = URL.createObjectURL(blob);
        uploadBlob(blob, previewUrl);
      },
      "image/jpeg",
      0.9
    );
  };

  const retake = () => {
    if (doc?.previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(doc.previewUrl);
    onChange(null);
    startCamera();
  };

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[3/2]";
  const stageClass = cn(
    "relative w-full mx-auto rounded-[16px] overflow-hidden hairline bg-black",
    aspectClass,
    aspect === "square" ? "max-w-[480px]" : ""
  );
  const readyLabel = mode === "selfie" ? "Selfie ready" : "Photo ready";
  const captureLabel = mode === "selfie" ? "Capture selfie" : "Capture photo";
  const idleHint =
    mode === "selfie"
      ? "Start the camera to capture a live selfie."
      : "Start the camera and hold the ID steady inside the frame.";

  return (
    <div className="flex flex-col gap-3">
      {label ? (
        <span className="text-xs font-medium text-white/70">{label}</span>
      ) : null}

      <div className={stageClass}>
        {/* Always-mounted video so the ref exists when the stream attaches.
            Hidden when we have a captured photo or before the stream lands. */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            !cameraReady || doc ? "invisible" : "visible",
            mode === "selfie" && "-scale-x-100"
          )}
        />

        {/* Face-align guide — face-shaped oval, only for selfie + live. */}
        {mode === "selfie" && cameraReady && !doc ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="face-guide-mask">
                <rect width="100" height="100" fill="white" />
                {/* Cut a face-shaped oval out of the dim overlay */}
                <ellipse cx="50" cy="48" rx="28" ry="38" fill="black" />
              </mask>
            </defs>
            {/* Dim everything outside the oval */}
            <rect
              width="100"
              height="100"
              fill="rgba(0,0,0,0.45)"
              mask="url(#face-guide-mask)"
            />
            {/* Dashed white oval outline */}
            <ellipse
              cx="50"
              cy="48"
              rx="28"
              ry="38"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="0.6"
              strokeDasharray="2 1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}

        {doc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.previewUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {doc.progress < 1 && !doc.error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[12px] gap-2">
                <Loader2 className="size-4 animate-spin" /> Uploading…
              </div>
            ) : null}
            {doc.error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[11px] text-red-300 px-2 text-center">
                {doc.error}
              </div>
            ) : null}
            {doc.mediaId ? (
              <span className="on-media absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-[11px] text-white">
                <CheckCircle2 className="size-3 text-green-300" /> {readyLabel}
              </span>
            ) : null}
          </>
        ) : !cameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <Camera className="size-8" />
            {cameraError ? (
              <p className="text-[12px] text-red-300 max-w-[260px] text-center px-3">
                {cameraError}
              </p>
            ) : (
              <p className="text-[12px] max-w-[240px] text-center">{idleHint}</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-2">
        {doc ? (
          <Button
            variant="secondary"
            onClick={retake}
            leftIcon={<RotateCcw />}
          >
            Retake
          </Button>
        ) : cameraReady ? (
          <Button onClick={capture} leftIcon={<Camera />}>
            {captureLabel}
          </Button>
        ) : (
          <Button
            onClick={startCamera}
            disabled={starting}
            leftIcon={<Camera />}
          >
            {starting ? "Starting…" : "Start camera"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Select (custom to match Input styling + native dropdown look) ── */

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label ? (
        <span className="text-xs font-medium text-white/70">{label}</span>
      ) : null}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] pl-4 pr-10 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors appearance-none",
            value ? "text-white" : "text-white/40"
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1a1a24] text-white">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-white/50" />
      </div>
    </div>
  );
}

/* ── Status card (verified / pending) ───────────────────── */

function StatusCard({
  status,
  server,
}: {
  status: IdentityStatus;
  server: IdentityOut | null;
}) {
  const meta = STATUS_META[status];
  return (
    <div className="max-w-2xl mt-4">
      <Card>
        <CardBody className="flex items-start gap-4">
          <span
            className={cn(
              "inline-flex items-center justify-center size-12 rounded-full shrink-0",
              meta.ring
            )}
          >
            <meta.Icon className={cn("size-6", meta.tint)} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-semibold text-white">
                {meta.title}
              </h2>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  meta.badge
                )}
              >
                {status}
              </span>
            </div>
            <p className="text-sm text-white/65 mt-1 leading-relaxed">
              {meta.body}
            </p>
            {server?.submittedAt ? (
              <p className="text-[11px] text-white/45 mt-2">
                Submitted{" "}
                {new Date(server.submittedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

const STATUS_META: Record<
  IdentityStatus,
  {
    Icon: React.ComponentType<{ className?: string }>;
    tint: string;
    ring: string;
    badge: string;
    title: string;
    body: string;
  }
> = {
  none: {
    Icon: ShieldCheck,
    tint: "text-white/70",
    ring: "bg-white/[0.06]",
    badge: "bg-white/[0.06] text-white/70",
    title: "Not started",
    body: "Get verified to publish posts, receive payouts, and charge for messages.",
  },
  pending: {
    Icon: Clock,
    tint: "text-yellow-300",
    ring: "bg-yellow-500/15",
    badge: "bg-yellow-500/15 text-yellow-200",
    title: "Under review",
    body: "We're checking your submission — this usually takes 24 hours or less. We'll notify you either way.",
  },
  verified: {
    Icon: ShieldCheck,
    tint: "text-green-300",
    ring: "bg-green-500/15",
    badge: "bg-green-500/15 text-green-200",
    title: "You're verified",
    body: "You've got full creator access. Publish, get paid, and charge for premium content.",
  },
  rejected: {
    Icon: ShieldX,
    tint: "text-red-300",
    ring: "bg-red-500/15",
    badge: "bg-red-500/15 text-red-200",
    title: "Needs another look",
    body: "Your last submission couldn't be verified. Update your details and re-apply.",
  },
};

/* ── Little tab pill used at the top ─────────────────── */

function StepTab({
  active,
  complete,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  complete: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[13px] font-semibold transition-colors",
        active
          ? "bg-white text-black"
          : disabled
          ? "text-white/30 cursor-not-allowed"
          : "text-white/70 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {complete ? (
        <CheckCircle2
          className={cn(
            "size-3.5",
            active ? "text-green-500" : "text-green-300"
          )}
        />
      ) : null}
      {children}
    </button>
  );
}
