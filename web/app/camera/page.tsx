"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, SwitchCamera, Upload } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ImageUploader } from "@/components/ImageUploader";
import { fileToDataUrl } from "@/services/imageUtils";
import { setSelectedImage } from "@/services/imageStore";
import type { LoadedImage } from "@/services/imageUtils";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");

  async function startCamera(mode: "user" | "environment") {
    stopCamera();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("Camera access denied or unavailable. Use the uploader below.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }

  useEffect(() => () => stopCamera(), []);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const img = await fileToDataUrl(await (await fetch(dataUrl)).blob());
    setSelectedImage(img);
    stopCamera();
    router.push("/analysis");
  };

  const onUploaded = (img: LoadedImage) => {
    stopCamera();
    setSelectedImage(img);
    router.push("/analysis");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold">Camera Capture</h1>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-800">
          <video
            ref={videoRef}
            className="mx-auto max-h-[60vh] w-full object-contain"
            playsInline
            muted
          />
          {!active && !error && (
            <div className="grid h-64 place-items-center text-slate-400">
              <p>Camera is off</p>
            </div>
          )}
          {error && (
            <div className="grid h-64 place-items-center px-6 text-center text-slate-400">
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!active ? (
            <button
              onClick={() => startCamera(facing)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white hover:bg-brand-600"
            >
              <Camera size={18} /> Start camera
            </button>
          ) : (
            <>
              <button
                onClick={capture}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-bold text-white hover:bg-emerald-600"
              >
                <Camera size={18} /> Capture
              </button>
              <button
                onClick={() =>
                  setFacing((f) => {
                    const next = f === "user" ? "environment" : "user";
                    startCamera(next);
                    return next;
                  })
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <SwitchCamera size={18} /> Flip
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <CameraOff size={18} /> Stop
              </button>
            </>
          )}
        </div>

        <div className="pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Upload size={14} /> or upload instead
          </p>
          <ImageUploader onSelected={onUploaded} label="Drop an image or click to browse" />
        </div>
      </div>
    </div>
  );
}
