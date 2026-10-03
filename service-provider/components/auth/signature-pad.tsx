"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

type SignaturePadProps = {
  value: string;
  onChange: (dataUrl: string) => void;
};

const STROKE_COLOR = "#1b2554";
const STROKE_WIDTH = 2.5;
// Keep the uploaded PNG small regardless of the device pixel ratio.
const MAX_EXPORT_WIDTH = 900;
// Small hollow circle cursor, centred on the pointer (hotspot 8,8).
const CIRCLE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="#1b2554" stroke-width="1.5"/></svg>',
)}") 8 8, crosshair`;

function exportSignature(canvas: HTMLCanvasElement): string {
  if (canvas.width <= MAX_EXPORT_WIDTH) {
    return canvas.toDataURL("image/png");
  }
  const scale = MAX_EXPORT_WIDTH / canvas.width;
  const output = document.createElement("canvas");
  output.width = MAX_EXPORT_WIDTH;
  output.height = Math.round(canvas.height * scale);
  output.getContext("2d")?.drawImage(canvas, 0, 0, output.width, output.height);
  return output.toDataURL("image/png");
}

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = STROKE_WIDTH;
    context.strokeStyle = STROKE_COLOR;
    context.fillStyle = STROKE_COLOR;

    // Resizing clears the canvas, so redraw any existing signature.
    if (valueRef.current) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = valueRef.current;
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const point = pointFromEvent(event);
    drawingRef.current = true;
    lastPointRef.current = point;
    // A tap without movement still leaves a visible dot.
    context.beginPath();
    context.arc(point.x, point.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
    context.fill();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const point = pointFromEvent(event);
    const last = lastPointRef.current;
    const mid = { x: (last.x + point.x) / 2, y: (last.y + point.y) / 2 };
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    onChange(exportSignature(event.currentTarget));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="relative h-48 overflow-hidden rounded-3xl border border-dashed border-[#cbd5e1] bg-white">
        <canvas
          ref={canvasRef}
          aria-label="Signature pad. Draw your signature with your finger, stylus or mouse."
          className="absolute inset-0 block h-full w-full touch-none"
          style={{ cursor: CIRCLE_CURSOR }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={finishStroke}
        />
        {!value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-300">
            Sign here with your finger or mouse
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={!value}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 disabled:opacity-40 transition"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear signature
        </button>
      </div>
    </div>
  );
}
