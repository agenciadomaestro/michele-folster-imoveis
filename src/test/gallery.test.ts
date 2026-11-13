import { describe, expect, it } from 'vitest';
import { galleryWindowStart, VISIBLE_GALLERY_PHOTOS } from '@/lib/gallery';

describe('property gallery navigation', () => {
  it('shows at most six thumbnails', () => {
    expect(Array.from({ length: 15 }).slice(0, VISIBLE_GALLERY_PHOTOS)).toHaveLength(6);
  });
  it('reveals additional photos when selecting the sixth visible image', () => {
    expect(galleryWindowStart(5, 0, 15)).toBe(1);
    expect(galleryWindowStart(6, 1, 15)).toBe(2);
  });
  it('keeps the final photo visible without passing the end', () => {
    expect(galleryWindowStart(14, 0, 15)).toBe(9);
  });
  it('returns to the first photo and handles short galleries', () => {
    expect(galleryWindowStart(0, 9, 15)).toBe(0);
    expect(galleryWindowStart(2, 0, 3)).toBe(0);
  });
});