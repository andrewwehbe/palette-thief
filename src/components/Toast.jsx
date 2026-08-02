export default function Toast({ toast }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50">
      {toast && (
        <div
          key={toast.id}
          className={`toast-in absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-medium backdrop-blur-md ${
            toast.tone === "error"
              ? "border-red-400/30 bg-red-950/80 text-red-200"
              : "border-white/10 bg-white/10 text-[#f7f7f8]"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
