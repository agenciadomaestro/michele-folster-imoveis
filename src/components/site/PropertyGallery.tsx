import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { galleryWindowStart, VISIBLE_GALLERY_PHOTOS } from "@/lib/gallery";

interface PropertyGalleryProps {
  photos: { url: string }[];
  title: string;
  selected: number;
  onSelect: (index: number) => void;
  onOpen: () => void;
}

export function PropertyGallery({
  photos,
  title,
  selected,
  onSelect,
  onOpen,
}: PropertyGalleryProps) {
  const [start, setStart] = useState(0);

  // Swipe & Drag states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    setStart((current) => galleryWindowStart(selected, current, photos.length));
  }, [selected, photos.length]);

  const maxStart = Math.max(0, photos.length - VISIBLE_GALLERY_PHOTOS);
  const hasMore = photos.length > VISIBLE_GALLERY_PHOTOS;

  const SWIPE_THRESHOLD = 40;

  const handleNext = () => {
    if (photos.length <= 1) return;
    onSelect((selected + 1) % photos.length);
  };

  const handlePrev = () => {
    if (photos.length <= 1) return;
    onSelect((selected - 1 + photos.length) % photos.length);
  };

  // Touch handlers (Mobile Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!photos.length) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setDragOffset(0);
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
      dragDistanceRef.current = Math.abs(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
      if (dragOffset < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffset(0);
  };

  const handleTouchCancel = () => {
    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffset(0);
  };

  // Mouse handlers (Desktop Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!photos.length || e.button !== 0) return;
    setMouseStartX(e.clientX);
    setIsMouseDown(true);
    setDragOffset(0);
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || mouseStartX === null) return;
    const diffX = e.clientX - mouseStartX;
    setDragOffset(diffX);
    dragDistanceRef.current = Math.abs(diffX);
  };

  const handleMouseUp = () => {
    if (isMouseDown && mouseStartX !== null) {
      if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
        if (dragOffset < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    setIsMouseDown(false);
    setMouseStartX(null);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isMouseDown) {
      if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
        if (dragOffset < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
      setIsMouseDown(false);
      setMouseStartX(null);
      setDragOffset(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 8) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpen();
  };

  return (
    <div
      aria-label="Galeria do imóvel"
      className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]"
    >
      {/* Foto Principal com Swipe Touch / Mouse Drag e Arredondamento Reduzido (rounded-xl) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
          if (e.key === "ArrowLeft") handlePrev();
          if (e.key === "ArrowRight") handleNext();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        aria-label="Ampliar foto selecionada (arraste para alternar)"
        className="group relative h-auto w-full aspect-[6/5] overflow-hidden rounded-xl bg-secondary p-0 cursor-grab active:cursor-grabbing select-none touch-pan-y"
      >
        <div
          className="size-full transition-transform duration-150 ease-out"
          style={{
            transform: dragOffset ? `translateX(${dragOffset * 0.35}px)` : undefined,
          }}
        >
          {photos[selected] ? (
            <img
              src={photos[selected].url}
              alt={title}
              draggable={false}
              className="absolute inset-0 size-full object-cover pointer-events-none select-none"
              width={1280}
              height={1067}
            />
          ) : (
            <div className="grid size-full place-items-center">
              <ImageOff className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Botões de seta sobrepostos na foto principal */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              title="Foto anterior"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 grid size-8 place-items-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-xs transition-colors shadow-sm"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              title="Próxima foto"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 grid size-8 place-items-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-xs transition-colors shadow-sm"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas (Thumbnails) com gap reduzido pela metade e cantos rounded-md */}
      {photos.length > 1 && (
        <div className="relative min-h-0 min-w-0">
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5 md:absolute md:inset-0 md:grid-cols-1 md:grid-rows-6 md:gap-2.5">
            {photos.slice(start, start + VISIBLE_GALLERY_PHOTOS).map((photo, offset) => {
              const index = start + offset;
              return (
                <Button
                  key={`${index}-${photo.url}`}
                  variant="ghost"
                  aria-label={`Ver foto ${index + 1}`}
                  aria-pressed={index === selected}
                  onClick={() => onSelect(index)}
                  className={`relative h-auto min-h-0 w-full aspect-square overflow-hidden rounded-md border-2 p-0 md:aspect-auto ${index === selected ? "border-primary" : "border-transparent"}`}
                >
                  <img
                    src={photo.url}
                    alt={`Foto ${index + 1} de ${title}`}
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover pointer-events-none"
                  />
                </Button>
              );
            })}
          </div>
          {hasMore && (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Mostrar fotos anteriores"
                title="Mostrar fotos anteriores"
                disabled={start === 0}
                onClick={() => setStart((current) => Math.max(0, current - 1))}
                className="absolute -left-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full md:left-1/2 md:top-1 md:-translate-x-1/2 md:translate-y-0"
              >
                <ChevronLeft className="md:hidden" />
                <ChevronUp className="hidden md:block" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Mostrar próximas fotos"
                title="Mostrar próximas fotos"
                disabled={start >= maxStart}
                onClick={() => setStart((current) => Math.min(maxStart, current + 1))}
                className="absolute -right-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full md:bottom-1 md:left-1/2 md:right-auto md:top-auto md:-translate-x-1/2 md:translate-y-0"
              >
                <ChevronRight className="md:hidden" />
                <ChevronDown className="hidden md:block" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
