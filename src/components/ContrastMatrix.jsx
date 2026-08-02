import { rgbToHex, contrastRatio } from "../lib/colorUtils.js";

function Chip({ rgb }) {
  return (
    <span
      className="inline-block h-5 w-5 rounded-md border border-white/15"
      style={{ backgroundColor: rgbToHex(rgb) }}
      aria-label={rgbToHex(rgb)}
      title={rgbToHex(rgb).toUpperCase()}
    />
  );
}

function ratioIcon(ratio) {
  if (ratio >= 4.5) return "✅";
  if (ratio >= 3) return "⚠️";
  return "❌";
}

export default function ContrastMatrix({ palette }) {
  return (
    <div className="fade-rise-in w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-xs">
        <caption className="sr-only">
          WCAG contrast ratios between every pair of palette colors
        </caption>
        <thead>
          <tr>
            <th scope="col" className="p-1" aria-label="Row color" />
            {palette.map((rgb, i) => (
              <th scope="col" key={i} className="p-1">
                <Chip rgb={rgb} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {palette.map((rowRgb, i) => (
            <tr key={i}>
              <th scope="row" className="p-1">
                <Chip rgb={rowRgb} />
              </th>
              {palette.map((colRgb, j) => {
                if (i === j) {
                  return (
                    <td key={j} className="rounded-lg bg-white/[0.02] p-2 text-white/20">
                      &mdash;
                    </td>
                  );
                }
                const ratio = contrastRatio(rowRgb, colRgb);
                return (
                  <td key={j} className="rounded-lg bg-white/[0.04] p-2 tabular-nums text-white/80">
                    <span aria-hidden="true">{ratioIcon(ratio)}</span>{" "}
                    <span>{ratio.toFixed(1)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-white/40">
        {"✅"} ≥ 4.5 (AA text) &nbsp; {"⚠️"} 3–4.5 (large text only) &nbsp;
        {"❌"} &lt; 3
      </p>
    </div>
  );
}
