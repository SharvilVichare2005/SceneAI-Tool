"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Upload, Film, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { fileToDataUrl } from "@/services/imageUtils";
import { setSelectedImage } from "@/services/imageStore";
import type { LoadedImage } from "@/services/imageUtils";

export default function VideoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [frame, setFrame] = useState<string | null>(null);

  const onFile = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setFrame(dataUrl);
  };

  const useFrame = async () => {
    if (!frame) return;
    const img: LoadedImage = await fileToDataUrl(await (await fetch(frame)).blob());
    setSelectedImage(img);
    router.push("/analysis");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold">Video Frame Analysis</h1>

        {!videoUrl ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center transition hover:border-brand dark:border-slate-700"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand dark:bg-slate-800">
              <Video size={22} />
            </div>
            <p className="font-semibold">Drop a video or click to browse</p>
            <p className="text-sm text-slate-500">MP4 / WebM — scrub to a frame and capture</p>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              className="mx-auto max-h-[55vh] w-full rounded-2xl bg-black"
            />

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={currentTime}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className="flex-1 accent-brand"
              />
              <button
                onClick={captureFrame}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-600"
              >
                <Film size={16} /> Capture frame
              </button>
            </div>

            {frame && (
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-sm font-medium">Captured frame:</p>
                <img
                  src={frame}
                  alt="captured frame"
                  className="mx-auto max-h-72 rounded-xl object-contain"
                />
                <button
                  onClick={useFrame}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-bold text-white hover:bg-emerald-600"
                >
                  <ArrowRight size={18} /> Analyze this frame
                </button>
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
            >
              <Upload size={14} /> Choose a different video
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </>
        )}
      </div>
    </div>
  );
}
