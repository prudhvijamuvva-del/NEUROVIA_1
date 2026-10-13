import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, AlertCircle, ShieldCheck, RefreshCw, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string, consent: boolean) => void;
  title: string;
  description: string;
  requireConsent?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  description,
  requireConsent = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setConsentGiven(false);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access failed or unavailable:", err);
      setCameraError("Camera access denied or no webcam detected. You can use the file upload alternative below to supply an image.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(base64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    if (requireConsent && !consentGiven) return;
    onCapture(capturedImage, consentGiven);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Capture Viewport */}
        <div className="my-5 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[300px]">
          {capturedImage ? (
            <div className="relative w-full h-[320px] flex items-center justify-center">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-teal-500/90 text-slate-950 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-4 h-4" /> Frame Locked
              </div>
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-4">{cameraError}</p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" /> Upload Face Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="relative w-full h-[320px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {/* Biometric HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-64 border-2 border-dashed border-teal-400/60 rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-teal-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-teal-400" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-teal-400" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-teal-400" />
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] font-mono text-teal-400/80 bg-slate-950/80 px-2 py-0.5 rounded">
                    CENTER FACE
                  </span>
                </div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Informed Biometric Consent Checkbox */}
        {requireConsent && (
          <div className="mb-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-400"
              />
              <span>
                I provide explicit, informed consent for biometric feature extraction. No raw facial images are stored; only mathematically salted feature hashes are verified.
              </span>
            </label>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {capturedImage ? (
            <button
              onClick={() => {
                setCapturedImage(null);
                startCamera();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retake Capture
            </button>
          ) : (
            <label className="cursor-pointer text-xs text-slate-400 hover:text-slate-200 underline">
              Or upload image from disk
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {capturedImage ? (
              <button
                onClick={handleConfirm}
                disabled={requireConsent && !consentGiven}
                className="px-5 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-lg shadow-lg font-semibold transition-colors"
              >
                Confirm Verification
              </button>
            ) : (
              <button
                onClick={captureFrame}
                disabled={!stream && !cameraError}
                className="px-5 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-lg shadow-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" /> Capture Face
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
