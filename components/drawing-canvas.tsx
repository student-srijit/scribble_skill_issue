'use client';

import React from "react"

import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

interface DrawingCanvasProps {
  isDrawing?: boolean;
  onDraw?: (dataUrl: string) => void;
  strokeColor?: string;
  strokeWidth?: number;
  tool?: 'pen' | 'eraser';
}

export const DrawingCanvas = forwardRef<
  { clearCanvas: () => void; getImage: () => string },
  DrawingCanvasProps
>(({ isDrawing = true, onDraw, strokeColor = '#a855f7', strokeWidth = 4, tool = 'pen' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingLocal, setIsDrawingLocal] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const snapshot = canvas.toDataURL();

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;

      if (snapshot && snapshot !== 'data:,') {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0, rect.width, rect.height);
        };
        image.src = snapshot;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setContext(ctx);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [strokeColor, strokeWidth]);

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    getImage: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL() : '';
    },
  }));

  useEffect(() => {
    if (context) {
      context.lineWidth = strokeWidth;
      context.strokeStyle = strokeColor;
      context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    }
  }, [context, strokeColor, strokeWidth, tool]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    setIsDrawingLocal(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingLocal || !context) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawingLocal(false);
    if (context && onDraw) {
      onDraw(canvasRef.current?.toDataURL() || '');
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl cursor-crosshair border border-purple-500/20"
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
