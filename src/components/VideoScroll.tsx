"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoScroll() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoOk]);

  return (
    <div className="bg-[#1B2E4B] py-20 px-4 flex flex-col items-center gap-8">
      <div className="text-center text-white">
        <h2 className="text-3xl md:text-5xl font-bold mb-3">
          As� de f�cil es <span className="text-[#2ECC8F]">fichar</span>
        </h2>
        <p className="text-gray-300 text-lg">Tus empleados fichan en segundos desde el m�vil</p>
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
          <p className="text-gray-400 text-sm">V�deo no disponible</p>
        </div>
      )}
    </div>
  );
}
