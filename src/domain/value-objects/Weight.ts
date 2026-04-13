export class Weight {
  private readonly value: number;
  private static readonly BASE_WEIGHT = 1.0;
  private static readonly GROWTH_FACTOR = 1.1;

  private constructor(weight: number) {
    this.value = weight;
  }

  static forQuestion(questionIndex: number): Weight {
    if (questionIndex < 0) {
      throw new Error('Question index cannot be negative');
    }

    const weight = Weight.BASE_WEIGHT * Math.pow(Weight.GROWTH_FACTOR, questionIndex);
    return new Weight(weight);
  }

  static fromValue(value: number): Weight {
    if (value <= 0) {
      throw new Error('Weight must be positive');
    }

    return new Weight(value);
  }

  getValue(): number {
    return this.value;
  }

  multiply(score: number): number {
    return this.value * score;
  }
}
