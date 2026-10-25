import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  confirmedLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  colorScheme?: 'emerald' | 'black' | 'amber';
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  confirmedLabel = 'Confirmed',
  onConfirm,
  disabled = false,
  colorScheme = 'emerald',
}) => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentPosRef = useRef(0);

  // Maximum slider travel distance
  const getMaxTravel = useCallback(() => {
    if (!containerRef.current) return 200;
    const containerWidth = containerRef.current.clientWidth;
    const thumbWidth = 52; // width of thumb in px
    return Math.max(10, containerWidth - thumbWidth - 8);
  }, []);

  const handleStart = (clientX: number) => {
    if (disabled || isConfirmed) return;
    setIsDragging(true);
    startXRef.current = clientX - currentPosRef.current;
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isConfirmed) return;
    const maxTravel = getMaxTravel();
    const newPos = Math.min(maxTravel, Math.max(0, clientX - startXRef.current));
    currentPosRef.current = newPos;
    setSliderPosition(newPos);
  }, [isDragging, isConfirmed, getMaxTravel]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isConfirmed) return;
    setIsDragging(false);
    const maxTravel = getMaxTravel();
    const threshold = maxTravel * 0.78;

    if (currentPosRef.current >= threshold) {
      // Confirmed!
      setSliderPosition(maxTravel);
      setIsConfirmed(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        onConfirm();
      }, 250);
    } else {
      // Snap back
      setSliderPosition(0);
      currentPosRef.current = 0;
    }
  }, [isDragging, isConfirmed, getMaxTravel, onConfirm]);

  // Window listeners for mouse / touch move & up
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Direct fallback click confirm
  const handleDirectConfirm = () => {
    if (disabled || isConfirmed) return;
    setIsConfirmed(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setTimeout(() => {
      onConfirm();
    }, 200);
  };

  const maxTravel = getMaxTravel();
  const progressRatio = maxTravel > 0 ? Math.min(1, sliderPosition / maxTravel) : 0;

  const bgActiveColor =
    colorScheme === 'emerald'
      ? 'bg-emerald-600'
      : colorScheme === 'amber'
      ? 'bg-amber-600'
      : 'bg-black';

  return (
    <div className="w-full space-y-1.5 select-none">
      <div
        ref={containerRef}
        className={`relative h-14 w-full rounded-2xl p-1 overflow-hidden transition-colors border shadow-inner ${
          disabled
            ? 'bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60'
            : isConfirmed
            ? `${bgActiveColor} border-transparent text-white`
            : 'bg-neutral-100 border-neutral-300'
        }`}
      >
        {/* Dynamic sliding fill color */}
        <div
          className={`absolute top-0 left-0 bottom-0 ${bgActiveColor} opacity-90 transition-all rounded-2xl pointer-events-none`}
          style={{
            width: isConfirmed ? '100%' : `${sliderPosition + 52}px`,
            transition: isDragging ? 'none' : 'width 0.25s ease-out',
          }}
        />

        {/* Center Prompt Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-black uppercase tracking-wider transition-opacity">
          {isConfirmed ? (
            <span className="flex items-center gap-1.5 text-white font-extrabold animate-in fade-in">
              <Check className="h-4 w-4 stroke-[3]" />
              <span>{confirmedLabel}</span>
            </span>
          ) : (
            <span
              className={`font-black text-xs transition-opacity duration-150 ${
                progressRatio > 0.4 ? 'text-white' : 'text-neutral-600'
              }`}
            >
              {label}
            </span>
          )}
        </div>

        {/* Interactive Drag Thumb Handle */}
        {!isConfirmed && (
          <div
            onMouseDown={(e) => handleStart(e.clientX)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) handleStart(e.touches[0].clientX);
            }}
            className={`absolute top-1 bottom-1 w-12 rounded-xl flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing z-10 transition-transform ${
              isDragging ? 'scale-105' : 'transition-all'
            } ${
              progressRatio > 0.6
                ? 'bg-white text-black'
                : `${bgActiveColor} text-white`
            }`}
            style={{
              transform: `translateX(${sliderPosition}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out',
            }}
          >
            <ChevronRight className="h-5 w-5 stroke-[2.5] animate-pulse" />
          </div>
        )}
      </div>

      {/* Accessible direct confirm button */}
      {!isConfirmed && !disabled && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleDirectConfirm}
            className="text-[10px] text-neutral-400 hover:text-black underline font-semibold transition-colors"
          >
            Tap here to confirm directly without sliding
          </button>
        </div>
      )}
    </div>
  );
};
