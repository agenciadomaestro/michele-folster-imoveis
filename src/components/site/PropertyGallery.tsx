import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { galleryWindowStart, VISIBLE_GALLERY_PHOTOS } from '@/lib/gallery';

interface PropertyGalleryProps {
  photos: { url: string }[];
  title: string;
  selected: number;
  onSelect: (index: number) => void;
  onOpen: () => void;
}

export function PropertyGallery({ photos, title, selected, onSelect, onOpen }: PropertyGalleryProps) {
  const [start, setStart] = useState(0);
  useEffect(() => {
    setStart(current => galleryWindowStart(selected, current, photos.length));
  }, [selected, photos.length]);
  const maxStart = Math.max(0, photos.length - VISIBLE_GALLERY_PHOTOS);
  const hasMore = photos.length > VISIBLE_GALLERY_PHOTOS;

  return (
    <div aria-label="Galeria do imóvel" className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
      <Button variant="ghost" onClick={onOpen} disabled={!photos.length} aria-label="Ampliar foto selecionada" className="relative h-auto w-full aspect-[6/5] overflow-hidden rounded-2xl bg-secondary p-0">
        {photos[selected] ? <img src={photos[selected].url} alt={title} className="absolute inset-0 size-full object-cover" width={1280} height={1067} /> : <ImageOff className="text-muted-foreground" />}
      </Button>
      {photos.length > 1 && (
        <div className="relative min-h-0 min-w-0">
          <div className="grid grid-cols-6 gap-2 md:absolute md:inset-0 md:grid-cols-1 md:grid-rows-6 md:gap-3">
            {photos.slice(start, start + VISIBLE_GALLERY_PHOTOS).map((photo, offset) => {
              const index = start + offset;
              return <Button key={`${index}-${photo.url}`} variant="ghost" aria-label={`Ver foto ${index + 1}`} aria-pressed={index === selected} onClick={() => onSelect(index)} className={`relative h-auto min-h-0 w-full aspect-square overflow-hidden rounded-lg border-2 p-0 md:aspect-auto ${index === selected ? 'border-primary' : 'border-transparent'}`}>
                <img src={photo.url} alt={`Foto ${index + 1} de ${title}`} loading="lazy" className="absolute inset-0 size-full object-cover" />
              </Button>;
            })}
          </div>
          {hasMore && <>
            <Button variant="outline" size="icon" aria-label="Mostrar fotos anteriores" title="Mostrar fotos anteriores" disabled={start === 0} onClick={() => setStart(current => Math.max(0, current - 1))} className="absolute -left-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full md:left-1/2 md:top-1 md:-translate-x-1/2 md:translate-y-0">
              <ChevronLeft className="md:hidden" /><ChevronUp className="hidden md:block" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Mostrar próximas fotos" title="Mostrar próximas fotos" disabled={start >= maxStart} onClick={() => setStart(current => Math.min(maxStart, current + 1))} className="absolute -right-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full md:bottom-1 md:left-1/2 md:right-auto md:top-auto md:-translate-x-1/2 md:translate-y-0">
              <ChevronRight className="md:hidden" /><ChevronDown className="hidden md:block" />
            </Button>
          </>}
        </div>
      )}
    </div>
  );
}