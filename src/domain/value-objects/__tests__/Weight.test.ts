import { Weight } from '../Weight';

describe('Weight Value Object', () => {
  describe('forQuestion', () => {
    it('should calculate geometric weight correctly for first question', () => {
      const weight = Weight.forQuestion(0);
      expect(weight.getValue()).toBeCloseTo(1.0, 5);
    });

    it('should calculate geometric weight correctly for second question', () => {
      const weight = Weight.forQuestion(1);
      expect(weight.getValue()).toBeCloseTo(1.1, 5);
    });

    it('should calculate geometric weight correctly for third question', () => {
      const weight = Weight.forQuestion(2);
      expect(weight.getValue()).toBeCloseTo(1.21, 5);
    });

    it('should calculate geometric weight correctly for fifth question', () => {
      const weight = Weight.forQuestion(4);
      expect(weight.getValue()).toBeCloseTo(1.4641, 4);
    });

    it('should throw error for negative index', () => {
      expect(() => Weight.forQuestion(-1)).toThrow('Question index cannot be negative');
    });

    it('should follow geometric progression formula: w = 1.0 * (1.1)^i', () => {
      const base = 1.0;
      const factor = 1.1;

      for (let i = 0; i < 8; i++) {
        const expected = base * Math.pow(factor, i);
        const actual = Weight.forQuestion(i).getValue();
        expect(actual).toBeCloseTo(expected, 5);
      }
    });
  });

  describe('fromValue', () => {
    it('should create weight from positive value', () => {
      const weight = Weight.fromValue(2.5);
      expect(weight.getValue()).toBe(2.5);
    });

    it('should throw error for zero value', () => {
      expect(() => Weight.fromValue(0)).toThrow('Weight must be positive');
    });

    it('should throw error for negative value', () => {
      expect(() => Weight.fromValue(-1)).toThrow('Weight must be positive');
    });
  });

  describe('multiply', () => {
    it('should multiply weight by score correctly', () => {
      const weight = Weight.forQuestion(2);
      const result = weight.multiply(3);
      expect(result).toBeCloseTo(3.63, 2);
    });

    it('should handle zero score', () => {
      const weight = Weight.forQuestion(3);
      expect(weight.multiply(0)).toBe(0);
    });
  });

  describe('geometric progression properties', () => {
    it('should increase monotonically', () => {
      const weights = Array.from({ length: 8 }, (_, i) =>
        Weight.forQuestion(i).getValue()
      );

      for (let i = 1; i < weights.length; i++) {
        expect(weights[i]).toBeGreaterThan(weights[i - 1]);
      }
    });

    it('should have ratio of 1.1 between consecutive weights', () => {
      for (let i = 1; i < 8; i++) {
        const w1 = Weight.forQuestion(i - 1).getValue();
        const w2 = Weight.forQuestion(i).getValue();
        const ratio = w2 / w1;
        expect(ratio).toBeCloseTo(1.1, 5);
      }
    });
  });
});
