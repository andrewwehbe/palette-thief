import { useCallback, useEffect, useRef, useState } from "react";
import { extractPalette } from "./lib/kmeans.js";
import { harmonize } from "./lib/harmonize.js";
import DropZone from "./components/DropZone.jsx";
import PaletteStrip from "./components/PaletteStrip.jsx";
import ContrastMatrix from "./components/ContrastMatrix.jsx";
import ExportBar from "./components/ExportBar.jsx";
import Toast from "./components/Toast.jsx";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 400;

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

async function decodeImage(file, objectUrl) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // some browsers reject the options bag or the format via this path
    }
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> decode
    }
  }
  const img = new Image();
  img.src = objectUrl;
  if (img.decode) {
    await img.decode();
  } else {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Image decode failed"));
    });
  }
  return img;
}

function paintTick() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 20))
  );
}

export default function App() {
  const [image, setImage] = useState(null); // { url, width, height, name }
  const [originalPalette, setOriginalPalette] = useState(null);
  const [displayPalette, setDisplayPalette] = useState(null);
  const [isHarmonized, setIsHarmonized] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showContrast, setShowContrast] = useState(false);
  const [paletteKey, setPaletteKey] = useState(0);
  const [toast, setToast] = useState(null);

  const imageUrlRef = useRef(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, tone = "info") => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(
    () => () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    },
    []
  );

  async function handleFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast("Only JPG, PNG, or WebP images work here", "error");
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast("That image is over 20 MB", "error");
      return;
    }

    // Full reset on every new upload.
    setOriginalPalette(null);
    setDisplayPalette(null);
    setIsHarmonized(false);
    setShowContrast(false);
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    const url = URL.createObjectURL(file);
    imageUrlRef.current = url;
    setImage({ url, name: file.name });
    setExtracting(true);

    try {
      await paintTick(); // let the shimmer skeleton paint before crunching
      const source = await decodeImage(file, url);
      const srcW = source.naturalWidth || source.width;
      const srcH = source.naturalHeight || source.height;
      const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
      const w = Math.max(1, Math.round(srcW * scale));
      const h = Math.max(1, Math.round(srcH * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(source, 0, 0, w, h);
      if (typeof source.close === "function") source.close();
      const { data } = ctx.getImageData(0, 0, w, h);
      const palette = extractPalette(data);
      setImage({ url, name: file.name, width: srcW, height: srcH });
      setOriginalPalette(palette);
      setDisplayPalette(palette);
      setPaletteKey((k) => k + 1);
    } catch {
      if (imageUrlRef.current === url) {
        URL.revokeObjectURL(url);
        imageUrlRef.current = null;
        setImage(null);
      }
      showToast("Couldn't read that image", "error");
    } finally {
      setExtracting(false);
    }
  }

  function handleHarmonize() {
    if (!originalPalette) return;
    // Always derived from the ORIGINAL palette — repeated clicks never drift.
    setDisplayPalette(harmonize(originalPalette));
    setIsHarmonized(true);
  }

  function handleUndo() {
    setDisplayPalette(originalPalette);
    setIsHarmonized(false);
  }

  const handleSwatchCopy = useCallback(
    async (hex) => {
      const ok = await copyText(hex);
      showToast(ok ? `Copied ${hex.toUpperCase()}!` : "Copy failed", ok ? "info" : "error");
    },
    [showToast]
  );

  const sessionActive = Boolean(image) || extracting;
  const actionButton =
    "min-h-[48px] rounded-2xl border px-5 text-sm font-medium active:scale-95 " +
    "disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {!sessionActive ? (
        <main className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
          <div className="relative z-10 text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Palette Thief
            </h1>
            <p className="mt-3 text-base text-white/55">Steal colors from anything.</p>
          </div>
          <DropZone onFile={handleFile} />
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-6 py-10 lg:py-16">
          <h1 className="font-display text-xl font-bold tracking-tight text-white/90">
            Palette Thief
          </h1>
          <div className="grid items-center gap-8 lg:grid-cols-[2fr_3fr] lg:gap-12">
            <div className="flex flex-col gap-4">
              {image && (
                <img
                  src={image.url}
                  alt={image.name ? `Uploaded: ${image.name}` : "Uploaded image"}
                  className="max-h-[45vh] w-full rounded-2xl border border-white/10 object-contain shadow-lg shadow-black/30 lg:max-h-[60vh]"
                />
              )}
              <DropZone onFile={handleFile} compact />
            </div>

            <div className="flex flex-col gap-5">
              <PaletteStrip
                key={paletteKey}
                palette={displayPalette}
                extracting={extracting}
                onCopy={handleSwatchCopy}
              />

              {displayPalette && !extracting && (
                <>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleHarmonize}
                      disabled={isHarmonized}
                      className={`${actionButton} border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#c4b5fd] hover:bg-[#8b5cf6]/25`}
                    >
                      <span aria-hidden="true">✨</span> Harmonize
                    </button>
                    {isHarmonized && (
                      <button
                        type="button"
                        onClick={handleUndo}
                        className={`${actionButton} border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.08]`}
                      >
                        Undo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowContrast((v) => !v)}
                      aria-expanded={showContrast}
                      className={`${actionButton} border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.08]`}
                    >
                      {showContrast ? "Hide Contrast" : "Check Contrast"}
                    </button>
                  </div>

                  {showContrast && <ContrastMatrix palette={displayPalette} />}

                  <div className="border-t border-white/10 pt-5">
                    <ExportBar
                      palette={displayPalette}
                      copyText={copyText}
                      showToast={showToast}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      )}
      <Toast toast={toast} />
    </div>
  );
}
