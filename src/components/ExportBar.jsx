import { rgbToHex } from "../lib/colorUtils.js";
import { renderPaletteCard } from "../lib/paletteCard.js";

const buttonBase =
  "min-h-[48px] rounded-2xl border px-5 text-sm font-medium active:scale-95 " +
  "transition-colors motion-safe:transition-[color,background-color,border-color,transform] " +
  "focus-visible:outline-2";

export default function ExportBar({ palette, copyText, showToast }) {
  const hexes = palette.map(rgbToHex);

  async function handleCopyCss() {
    const css =
      ":root {\n" + hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join("\n") + "\n}";
    const ok = await copyText(css);
    showToast(ok ? "CSS copied" : "Copy failed", ok ? "info" : "error");
  }

  async function handleCopyFigma() {
    const ok = await copyText(hexes.join("\n"));
    showToast(ok ? "Hex list copied for Figma" : "Copy failed", ok ? "info" : "error");
  }

  async function handleDownload() {
    try {
      const blob = await renderPaletteCard(palette);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "palette-thief.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Palette card downloaded");
    } catch {
      showToast("Couldn't render the palette card", "error");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleCopyCss}
        className={`${buttonBase} border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.08]`}
      >
        Copy CSS
      </button>
      <button
        type="button"
        onClick={handleCopyFigma}
        className={`${buttonBase} border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.08]`}
      >
        Copy for Figma
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className={`${buttonBase} border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#c4b5fd] hover:bg-[#8b5cf6]/25`}
      >
        Download PNG
      </button>
    </div>
  );
}
