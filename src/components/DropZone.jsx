import { useRef, useState } from "react";

const coarsePointer =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

export default function DropZone({ onFile, compact = false }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const file = fileList && fileList[0];
    if (file) onFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  const inputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {inputs}
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`min-h-[48px] rounded-2xl border border-dashed px-5 text-sm font-medium text-white/70 active:scale-95 hover:text-white ${
            dragging ? "border-[#8b5cf6] bg-[#8b5cf6]/10" : "border-white/20 bg-transparent"
          }`}
        >
          Upload a new image
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className={`min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/70 active:scale-95 hover:text-white ${
            coarsePointer ? "" : "sm:hidden"
          }`}
        >
          Use Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
      {inputs}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image: drag and drop, or press Enter to browse"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative z-10 flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors sm:py-10 ${
          dragging
            ? "border-[#8b5cf6] bg-[#8b5cf6]/15"
            : "border-white/30 bg-black/10 hover:border-white/50 hover:bg-black/20"
        }`}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2" />
        </svg>
        <div>
          <p className="font-display text-lg font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            Drop an image here
          </p>
          <p className="mt-1 text-sm text-white/70 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            or click to browse &middot; JPG, PNG, WebP &middot; up to 20 MB
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className={`relative z-10 mt-4 min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-white/70 active:scale-95 hover:text-white ${
          coarsePointer ? "" : "sm:hidden"
        }`}
      >
        Use Camera
      </button>
    </div>
  );
}
