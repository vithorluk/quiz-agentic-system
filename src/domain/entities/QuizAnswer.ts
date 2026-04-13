import { Score } from '../value-objects/Score.js';
import { Weight } from '../value-objects/Weight.js';

export class QuizAnswer {
  constructor(
    public readonly questionIndex: number,
    public readonly userAnswers: ReadonlyArray<number>,
    public readonly correctAnswers: ReadonlyArray<number>,
    public readonly score: Score,
    public readonly weight: Weight
  ) {}

  getWeightedScore(): number {
    return this.weight.multiply(this.score.getValue());
  }

  isCorrect(): boolean {
    return this.score.isPerfect();
  }

  isWrong(): boolean {
    return this.score.isZero();
  }

  isPartial(): boolean {
    return !this.isCorrect() && !this.isWrong();
  }
}
