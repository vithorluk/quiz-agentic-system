export class Score {
  private readonly value: number;
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 4;

  private constructor(score: number) {
    this.value = score;
  }

  static create(score: number): Score {
    if (score < Score.MIN_SCORE || score > Score.MAX_SCORE) {
      throw new Error(`Score must be between ${Score.MIN_SCORE} and ${Score.MAX_SCORE}`);
    }

    return new Score(score);
  }

  static zero(): Score {
    return new Score(Score.MIN_SCORE);
  }

  static perfect(): Score {
    return new Score(Score.MAX_SCORE);
  }

  static partial(correctSelections: number, totalCorrect: number): Score {
    if (totalCorrect === 0) {
      return Score.zero();
    }

    const ratio = correctSelections / totalCorrect;
    const value = Math.max(Score.MIN_SCORE, Math.min(Score.MAX_SCORE, ratio * Score.MAX_SCORE));

    return new Score(value);
  }

  getValue(): number {
    return this.value;
  }

  isPerfect(): boolean {
    return this.value === Score.MAX_SCORE;
  }

  isZero(): boolean {
    return this.value === Score.MIN_SCORE;
  }
}
