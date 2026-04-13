export class Question {
  constructor(
    public readonly text: string,
    public readonly answers: ReadonlyArray<string>,
    public readonly correctAnswers: ReadonlyArray<number>,
    public readonly isMultipleChoice: boolean,
    public readonly explanation?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.text.length < 10) {
      throw new Error('Question text must be at least 10 characters');
    }

    if (this.answers.length !== 4) {
      throw new Error('Question must have exactly 4 answers');
    }

    if (this.correctAnswers.length === 0) {
      throw new Error('Question must have at least one correct answer');
    }

    const uniqueCorrect = new Set(this.correctAnswers);
    if (uniqueCorrect.size !== this.correctAnswers.length) {
      throw new Error('Correct answers must be unique');
    }

    for (const idx of this.correctAnswers) {
      if (idx < 0 || idx >= this.answers.length) {
        throw new Error('Correct answer index out of range');
      }
    }

    if (this.isMultipleChoice && this.correctAnswers.length === 1) {
      throw new Error('Multiple choice question must have more than one correct answer');
    }

    if (!this.isMultipleChoice && this.correctAnswers.length > 1) {
      throw new Error('Single choice question cannot have multiple correct answers');
    }
  }

  isCorrect(userAnswers: ReadonlyArray<number>): boolean {
    if (userAnswers.length !== this.correctAnswers.length) {
      return false;
    }

    const userSet = new Set(userAnswers);
    const correctSet = new Set(this.correctAnswers);

    return userAnswers.every(ans => correctSet.has(ans)) &&
           this.correctAnswers.every(ans => userSet.has(ans));
  }

  getPartialCredit(userAnswers: ReadonlyArray<number>): number {
    if (!this.isMultipleChoice) {
      return this.isCorrect(userAnswers) ? 1 : 0;
    }

    const correctSet = new Set(this.correctAnswers);
    const correctSelections = userAnswers.filter(ans => correctSet.has(ans)).length;

    return correctSelections / this.correctAnswers.length;
  }
}
