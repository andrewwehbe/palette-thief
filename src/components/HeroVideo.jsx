import { useEffect, useRef, useState } from "react";

const reducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const saveData =
  typeof navigator !== "undefined" &&
  navigator.connection &&
  navigator.connection.saveData === true;

/**
 * Full-viewport looping hero video. Muted, no controls, sits behind the
 * empty-state content. Falls back to the poster still under reduced-motion,
 * Data Saver, or if the video fails to load; retries play() on first
 * interaction for browsers that block autoplay (iOS Low Power Mode).
 */
export default function HeroVideo({ src, poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const useVideo = !reducedMotion && !saveData && !failed;

  useEffect(() => {
    if (!useVideo) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();

    const onInteract = () => {
      if (video.paused) tryPlay();
    };
    window.addEventListener("pointerdown", onInteract, { passive: true });
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [useVideo]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0e0e11]"
      aria-hidden="true"
    >
      <img
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {useVideo && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {/* scrim: keeps the title and drop zone readable over the paint */}
      <div className="absolute inset-0 bg-[#0e0e11]/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(14_14_17/0.75)_100%)]" />
    </div>
  );
}
