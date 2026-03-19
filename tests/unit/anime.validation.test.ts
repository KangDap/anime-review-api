import { describe, it, expect } from 'vitest';

interface AnimeInput {
  title?: string;
  synopsis?: string;
  genre?: string;
  releaseYear?: unknown;
}

export function validateAnimeInput(data: AnimeInput) {
  const errors: string[] = [];

  if (!data.title) errors.push('title is required');
  if (!data.synopsis) errors.push('synopsis is required');
  if (!data.genre) errors.push('genre is required');
  if (!data.releaseYear) errors.push('releaseYear is required');

  if (data.releaseYear !== undefined) {
    if (typeof data.releaseYear !== 'number') {
      errors.push('releaseYear must be a number');
    } else if (data.releaseYear < 1900 || data.releaseYear > 2100) {
      errors.push('releaseYear must be between 1900 and 2100');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

describe('Anime Input Validation', () => {
  describe('valid anime data', () => {
    it('should accept valid anime data', () => {
      const input = {
        title: 'Attack on Titan',
        synopsis: 'Humanity fights against giant humanoid creatures.',
        genre: 'Action',
        releaseYear: 2013,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept anime with different genres', () => {
      const genres = ['Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi'];

      genres.forEach((genre) => {
        const input = {
          title: 'Test Anime',
          synopsis: 'Test synopsis',
          genre,
          releaseYear: 2020,
        };

        const result = validateAnimeInput(input);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('missing required fields', () => {
    it('should reject anime without title', () => {
      const input = {
        synopsis: 'Test synopsis',
        genre: 'Action',
        releaseYear: 2020,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title is required');
    });

    it('should reject anime without synopsis', () => {
      const input = {
        title: 'Test Anime',
        genre: 'Action',
        releaseYear: 2020,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('synopsis is required');
    });

    it('should reject anime without genre', () => {
      const input = {
        title: 'Test Anime',
        synopsis: 'Test synopsis',
        releaseYear: 2020,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('genre is required');
    });

    it('should reject anime without releaseYear', () => {
      const input = {
        title: 'Test Anime',
        synopsis: 'Test synopsis',
        genre: 'Action',
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('releaseYear is required');
    });

    it('should reject anime with all fields missing', () => {
      const input = {};

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('invalid releaseYear', () => {
    it('should reject releaseYear below 1900', () => {
      const input = {
        title: 'Old Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 1899,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('releaseYear must be between 1900 and 2100');
    });

    it('should reject releaseYear above 2100', () => {
      const input = {
        title: 'Future Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2101,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('releaseYear must be between 1900 and 2100');
    });

    it('should reject non-number releaseYear', () => {
      const input = {
        title: 'Test Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: '2020',
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('releaseYear must be a number');
    });

    it('should accept valid year at boundaries', () => {
      const validYears = [1900, 1950, 2000, 2020, 2100];

      validYears.forEach((year) => {
        const input = {
          title: 'Test',
          synopsis: 'Test',
          genre: 'Action',
          releaseYear: year,
        };

        const result = validateAnimeInput(input);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const input = {
        title: '',
        synopsis: '',
        genre: '',
        releaseYear: 2020,
      };

      const result = validateAnimeInput(input);

      expect(result.valid).toBe(false);
    });

    it('should handle null values', () => {
      const input = {
        title: null,
        synopsis: null,
        genre: null,
        releaseYear: null,
      };

      const result = validateAnimeInput(input as unknown as AnimeInput);

      expect(result.valid).toBe(false);
    });

    it('should handle undefined values', () => {
      const input = {
        title: undefined,
        synopsis: undefined,
        genre: undefined,
        releaseYear: undefined,
      };

      const result = validateAnimeInput(input as unknown as AnimeInput);

      expect(result.valid).toBe(false);
    });
  });
});
