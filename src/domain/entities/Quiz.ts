import { Question } from './Question.js';
import { Url } from '../value-objects/Url.js';

export class Quiz {
  constructor(
    public readonly questions: ReadonlyArray<Question>,
    public readonly topic: string,
    public readonly sourceUrl: Url
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.questions.length < 5) {
      throw new Error('Quiz must have at least 5 questions');
    }

    if (this.questions.length > 8) {
      throw new Error('Quiz must have at most 8 questions');
    }

    if (!this.topic || this.topic.trim() === '') {
      throw new Error('Quiz topic cannot be empty');
    }
  }

  getQuestionCount(): number {
    return this.questions.length;
  }

  getQuestion(index: number): Question {
    if (index < 0 || index >= this.questions.length) {
      throw new Error('Question index out of range');
    }

    return this.questions[index];
  }
}
