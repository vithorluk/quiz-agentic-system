import { Score } from '../Score';

describe('Score Value Object', () => {
  describe('create', () => {
    it('should create score with valid value', () => {
      const score = Score.create(3.5);
      expect(score.getValue()).toBe(3.5);
    });

    it('should throw error for score below 0', () => {
      expect(() => Score.create(-0.1)).toThrow('Score must be between 0 and 4');
    });

    it('should throw error for score above 4', () => {
      expect(() => Score.create(4.1)).toThrow('Score must be between 0 and 4');
    });

    it('should accept boundary values', () => {
      expect(Score.create(0).getValue()).toBe(0);
      expect(Score.create(4).getValue()).toBe(4);
    });
  });

  describe('zero', () => {
    it('should create zero score', () => {
      const score = Score.zero();
      expect(score.getValue()).toBe(0);
      expect(score.isZero()).toBe(true);
    });
  });

  describe('perfect', () => {
    it('should create perfect score', () => {
      const score = Score.perfect();
      expect(score.getValue()).toBe(4);
      expect(score.isPerfect()).toBe(true);
    });
  });

  describe('partial', () => {
    it('should calculate correct partial score', () => {
      const score = Score.partial(2, 3);
      expect(score.getValue()).toBeCloseTo(2.667, 2);
    });

    it('should return zero when no correct selections', () => {
      const score = Score.partial(0, 3);
      expect(score.getValue()).toBe(0);
      expect(score.isZero()).toBe(true);
    });

    it('should return perfect when all correct', () => {
      const score = Score.partial(3, 3);
      expect(score.getValue()).toBe(4);
      expect(score.isPerfect()).toBe(true);
    });

    it('should handle edge case of zero total correct', () => {
      const score = Score.partial(0, 0);
      expect(score.getValue()).toBe(0);
    });

    it('should give half score for half correct in multiple choice', () => {
      const score = Score.partial(2, 4);
      expect(score.getValue()).toBe(2);
    });
  });

  describe('isPerfect', () => {
    it('should return true only for score of 4', () => {
      expect(Score.create(4).isPerfect()).toBe(true);
      expect(Score.create(3.99).isPerfect()).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true only for score of 0', () => {
      expect(Score.create(0).isZero()).toBe(true);
      expect(Score.create(0.01).isZero()).toBe(false);
    });
  });
});
