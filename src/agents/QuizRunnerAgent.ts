import inquirer from 'inquirer';
import { Quiz } from '../domain/entities/Quiz.js';
import { QuizAnswer } from '../domain/entities/QuizAnswer.js';
import { Weight } from '../domain/value-objects/Weight.js';
import { Score } from '../domain/value-objects/Score.js';
import { Logger } from '../utils/logger.js';

export interface QuizRunResult {
  answers: QuizAnswer[];
  completedAt: Date;
}

export class QuizRunnerAgent {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('QuizRunner');
  }

  async run(quiz: Quiz): Promise<QuizRunResult> {
    this.logger.info(`Starting quiz: ${quiz.topic}`);

    console.log('\n' + '='.repeat(80));
    console.log(`📝 Quiz: ${quiz.topic}`);
    console.log(`📊 Questions: ${quiz.getQuestionCount()}`);
    console.log(`🔗 Source: ${quiz.sourceUrl.getValue()}`);
    console.log('='.repeat(80) + '\n');

    const answers: QuizAnswer[] = [];

    for (let i = 0; i < quiz.getQuestionCount(); i++) {
      const question = quiz.getQuestion(i);
      const userAnswer = await this.askQuestion(question, i + 1, quiz.getQuestionCount());

      const weight = Weight.forQuestion(i);
      const score = this.calculateScore(userAnswer, question.correctAnswers, question.isMultipleChoice);

      const quizAnswer = new QuizAnswer(
        i,
        userAnswer,
        question.correctAnswers,
        score,
        weight
      );

      answers.push(quizAnswer);

      this.showFeedback(quizAnswer, question);
    }

    this.logger.success('Quiz completed');

    return {
      answers,
      completedAt: new Date()
    };
  }

  private async askQuestion(
    question: any,
    current: number,
    total: number
  ): Promise<number[]> {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Question ${current}/${total}`);
    console.log(`${'─'.repeat(80)}\n`);
    console.log(`${question.text}\n`);

    const choices = question.answers.map((answer: string, idx: number) => ({
      name: `${String.fromCharCode(65 + idx)}. ${answer}`,
      value: idx
    }));

    if (question.isMultipleChoice) {
      const answer = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selection',
          message: 'Select all correct answers (use Space to select, Enter to confirm):',
          choices,
          validate: (input: any[]) => {
            if (input.length === 0) {
              return 'Please select at least one answer';
            }
            return true;
          }
        }
      ]);

      return answer.selection;
    } else {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'selection',
          message: 'Select your answer:',
          choices
        }
      ]);

      return [answer.selection];
    }
  }

  private calculateScore(
    userAnswers: number[],
    correctAnswers: ReadonlyArray<number>,
    isMultipleChoice: boolean
  ): Score {
    if (!isMultipleChoice) {
      const isCorrect = userAnswers.length === 1 &&
                       correctAnswers.length === 1 &&
                       userAnswers[0] === correctAnswers[0];
      return isCorrect ? Score.perfect() : Score.zero();
    }

    const correctSet = new Set(correctAnswers);
    const userSet = new Set(userAnswers);

    const allCorrect = userAnswers.every(ans => correctSet.has(ans)) &&
                       correctAnswers.every(ans => userSet.has(ans));

    if (allCorrect) {
      return Score.perfect();
    }

    const correctSelections = userAnswers.filter(ans => correctSet.has(ans)).length;

    if (correctSelections === 0) {
      return Score.zero();
    }

    return Score.partial(correctSelections, correctAnswers.length);
  }

  private showFeedback(answer: QuizAnswer, question: any): void {
    console.log('');

    if (answer.isCorrect()) {
      console.log('✅ Correct!');
    } else if (answer.isPartial()) {
      console.log(`⚠️  Partially correct (${answer.score.getValue().toFixed(2)}/4 points)`);
    } else {
      console.log('❌ Incorrect');
    }

    console.log(`📍 Correct answer(s): ${answer.correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')}`);

    if (question.explanation) {
      console.log(`\n💡 Explanation: ${question.explanation}`);
    }

    console.log('');
  }
}
