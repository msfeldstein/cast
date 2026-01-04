import { useEffect, useRef } from 'react';
import './MainOutput.css';

interface MainOutputProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function MainOutput({ canvasRef }: MainOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [canvasRef]);

  return (
    <div className="main-output" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
