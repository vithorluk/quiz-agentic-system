import { Quiz } from './Quiz.js';
import { QuizAnswer } from './QuizAnswer.js';

export class QuizSession {
  constructor(
    public readonly quiz: Quiz,
    public readonly answers: ReadonlyArray<QuizAnswer>,
    public readonly finalScore: number,
    public readonly createdAt: Date,
    public readonly id?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.answers.length !== this.quiz.getQuestionCount()) {
      throw new Error('Number of answers must match number of questions');
    }

    if (this.finalScore < 0 || this.finalScore > 4) {
      throw new Error('Final score must be between 0 and 4');
    }
  }

  getCorrectCount(): number {
    return this.answers.filter(a => a.isCorrect()).length;
  }

  getWrongCount(): number {
    return this.answers.filter(a => a.isWrong()).length;
  }

  getPartialCount(): number {
    return this.answers.filter(a => a.isPartial()).length;
  }

  getPercentage(): number {
    return (this.finalScore / 4) * 100;
  }
}
