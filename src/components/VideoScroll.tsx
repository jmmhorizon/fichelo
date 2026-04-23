"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoScroll() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    video.pause();
    video.currentTime = 0;

    const onScroll = () => {
      if (!video.duration) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      if (sectionHeight <= 0) return;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(scrolled / sectionHeight, 1);
      video.currentTime = progress * video.duration;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [videoOk]);

  return (
    <div ref={sectionRef} style={{ height: "250vh" }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center bg-[#1B2E4B] overflow-hidden gap-8 px-4">
        <div className="text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            Así de fácil es <span className="text-[#2ECC8F]">fichar</span>
          </h2>
          <p className="text-gray-300 text-lg">Tus empleados fichan en segundos desde el móvil</p>
        </div>
        {videoOk ? (
          <video
            ref={videoRef}
            src="/hero.mp4"
            muted
            playsInline
            preload="auto"
            onError={() => setVideoOk(false)}
            className="w-full max-w-2xl rounded-2xl shadow-2xl"
          />
        ) : (
          <div className="w-full max-w-2xl h-72 rounded-2xl bg-white/10 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Vídeo no disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
