"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { fileToDataUrl, type LoadedImage } from "@/services/imageUtils";

interface Props {
  onSelected: (img: LoadedImage) => void;
  label?: string;
  accept?: string;
}

export function ImageUploader({
  onSelected,
  label = "Drop an image or click to browse",
  accept = "image/*",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    setProcessing(true);
    try {
      const img = await fileToDataUrl(file);
      onSelected(img);
    } catch {
      setError("We could not read that image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragging
          ? "border-brand bg-brand-50 dark:bg-slate-800"
          : "border-slate-300 hover:border-brand hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
      }`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand dark:bg-slate-800">
        {processing ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-slate-500">PNG, JPG, WEBP up to 10 MB (auto-scaled)</p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        disabled={processing}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
      >
        {processing ? "Reading image…" : "Choose from device"}
      </button>
      {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }}
      />
    </div>
  );
}

export default ImageUploader;
