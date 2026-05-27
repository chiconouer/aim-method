"use client";

import { useState } from "react";
import JSZip from "jszip";

export interface GeneratedImage {
  position: number;
  type: string;
  url: string;
}

interface GalleryProps {
  images: GeneratedImage[];
  customerName: string | null;
}

// Cross-origin URLs (Supabase Storage) ignore the <a download> attribute.
// fetch → blob → object URL → click is the reliable way to trigger a real
// browser download for files hosted on a different domain.
async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export default function Gallery({ images, customerName }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipError, setZipError] = useState<string | null>(null);

  const sorted = [...images].sort((a, b) => a.position - b.position);
  const active = activeIndex !== null ? sorted[activeIndex] : null;
  const firstName = customerName?.split(" ")[0] || "there";

  async function handleDownloadAll() {
    setDownloadingAll(true);
    setZipProgress(0);
    setZipError(null);
    try {
      const zip = new JSZip();
      let added = 0;
      for (let i = 0; i < sorted.length; i++) {
        const img = sorted[i];
        try {
          const res = await fetch(img.url);
          if (!res.ok) throw new Error(`fetch ${res.status}`);
          const blob = await res.blob();
          zip.file(
            `aim-model-${String(img.position).padStart(2, "0")}-${img.type}.jpg`,
            blob,
          );
          added++;
        } catch (err) {
          console.error(`Failed to add photo ${img.position} to zip:`, err);
        }
        setZipProgress(i + 1);
      }
      if (added === 0) {
        throw new Error("no photos could be fetched");
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(zipBlob, "ai-model-photos.zip");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("ZIP generation failed:", msg);
      setZipError("Couldn't build the ZIP. Try downloading photos individually.");
    } finally {
      setDownloadingAll(false);
      setZipProgress(0);
    }
  }

  async function handleDownloadOne(img: GeneratedImage) {
    try {
      await downloadFromUrl(
        img.url,
        `aim-model-${String(img.position).padStart(2, "0")}-${img.type}.jpg`,
      );
    } catch (err) {
      console.error(`Failed to download photo ${img.position}:`, err);
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          Your AI model is{" "}
          <span className="neon-purple">ready</span>{" "}🎉
        </h1>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-6">
          Hi {firstName} — here are your {sorted.length} hyperrealistic photos. Click any thumbnail to view full size.
        </p>
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="inline-block bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors text-white font-bold text-base px-6 py-3 rounded-xl shadow-lg shadow-purple-900/30"
        >
          {downloadingAll
            ? zipProgress < sorted.length
              ? `Preparing ZIP (${zipProgress}/${sorted.length})…`
              : "Generating ZIP file…"
            : `Download All as ZIP (${sorted.length})`}
        </button>
        {zipError && (
          <p className="text-red-400 text-sm mt-3" role="alert">
            {zipError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {sorted.map((img, idx) => (
          <button
            key={img.position}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-purple-900/30 bg-purple-900/10 hover:border-purple-500/60 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`AI photo ${img.position}`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs font-mono px-1.5 py-0.5 rounded">
              {String(img.position).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={`AI photo ${active.position} full size`}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleDownloadOne(active)}
                className="bg-purple-600 hover:bg-purple-500 transition-colors text-white font-bold text-sm px-5 py-2 rounded-lg"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="bg-gray-700 hover:bg-gray-600 transition-colors text-white font-bold text-sm px-5 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute top-2 right-2 sm:-top-3 sm:-right-3 w-9 h-9 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center shadow-lg"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
