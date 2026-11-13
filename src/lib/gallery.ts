export const VISIBLE_GALLERY_PHOTOS = 6;

export function galleryWindowStart(selected: number, start: number, total: number): number {
  const maxStart = Math.max(0, total - VISIBLE_GALLERY_PHOTOS);
  if (selected < start) return Math.max(0, selected);
  // Selecting the last visible photo reveals the next one, without hiding the selection.
  if (selected >= start + VISIBLE_GALLERY_PHOTOS - 1) {
    return Math.min(maxStart, selected - VISIBLE_GALLERY_PHOTOS + 2);
  }
  return Math.min(maxStart, Math.max(0, start));
}