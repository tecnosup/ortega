"use client";

import { useEffect, useRef } from "react";

const MODEL_ID = "1629b56db814401aaf7f3868f0577472";

declare global {
  interface Window {
    Sketchfab: new (version: string, iframe: HTMLIFrameElement) => {
      init: (modelId: string, opts: Record<string, unknown>) => void;
    };
  }
}

export default function Hero3D() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
    script.async = true;
    script.onload = () => {
      if (!iframeRef.current || !window.Sketchfab) return;

      const client = new window.Sketchfab("1.12.1", iframeRef.current);
      client.init(MODEL_ID, {
        success: (api: {
          start: () => void;
          addEventListener: (event: string, cb: () => void) => void;
          setCameraLookAt: (
            eye: [number, number, number],
            target: [number, number, number],
            duration: number
          ) => void;
        }) => {
          api.start();
          api.addEventListener("viewerready", () => {
            // heroic camera angle — slightly above and front
            api.setCameraLookAt(
              [0, 1.2, 4.5],
              [0, 0.8, 0],
              0
            );
          });
        },
        error: () => {},
        ui_stop: 0,
        ui_infos: 0,
        ui_inspector: 0,
        ui_settings: 0,
        ui_watermark: 0,
        ui_annotations: 0,
        ui_controls: 0,
        ui_vr: 0,
        ui_help: 0,
        ui_fullscreen: 0,
        ui_hint: 0,
        transparent: 1,
        autostart: 1,
        preload: 1,
        camera: 0,
        scrollwheel: 0,
        double_click: 0,
        autoRotate: 1,
        autoRotateSpeed: 0.3,
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* floating ambient glow behind model */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#b8944a]/8 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-2xl" />
      </div>
      <iframe
        ref={iframeRef}
        title="Medieval Knight"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className="w-full h-full"
        style={{ border: "none", background: "transparent" }}
      />
    </div>
  );
}
