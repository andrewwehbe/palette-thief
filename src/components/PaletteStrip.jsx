import Swatch from "./Swatch.jsx";

export default function PaletteStrip({ palette, extracting, onCopy }) {
  if (extracting) {
    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="shimmer min-h-[120px] w-full rounded-2xl border border-white/5 lg:min-h-[220px]"
          />
        ))}
      </div>
    );
  }

  if (!palette) return null;

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      {palette.map((rgb, i) => (
        <Swatch key={i} rgb={rgb} index={i} onCopy={onCopy} />
      ))}
    </div>
  );
}
