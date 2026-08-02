import { rgbToHex, textColorFor } from "../lib/colorUtils.js";
import { nearestColorName } from "../lib/colorNames.js";

export default function Swatch({ rgb, index, onCopy }) {
  const hex = rgbToHex(rgb);
  const textColor = textColorFor(rgb);
  const name = nearestColorName(rgb);
  const [r, g, b] = rgb;

  return (
    <button
      type="button"
      onClick={() => onCopy(hex)}
      className="swatch-btn swatch-in group flex min-h-[120px] w-full flex-col items-start justify-end rounded-2xl border border-white/10 p-4 text-left lg:min-h-[220px]"
      style={{ backgroundColor: hex, color: textColor, "--stagger": `${index * 60}ms` }}
      aria-label={`Copy ${hex}, ${name}`}
      title={`Click to copy ${hex.toUpperCase()}`}
    >
      <span className="font-display text-lg font-semibold tracking-wide">
        {hex.toUpperCase()}
      </span>
      <span className="mt-0.5 text-xs opacity-80">{`rgb(${r}, ${g}, ${b})`}</span>
      <span className="mt-1 text-xs font-medium capitalize opacity-90">{name}</span>
    </button>
  );
}
