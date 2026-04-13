import { QuizAnswer } from '../domain/entities/QuizAnswer.js';
import { Logger } from '../utils/logger.js';

export interface ScoreReport {
  finalScore: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  partialCount: number;
  totalQuestions: number;
  weightedScores: number[];
  totalWeight: number;
}

export class ScorerAgent {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Scorer');
  }

  calculate(answers: QuizAnswer[]): ScoreReport {
    this.logger.info(`Calculating score for ${answers.length} answers`);

    const weightedScores: number[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const answer of answers) {
      const weightedScore = answer.getWeightedScore();
      weightedScores.push(weightedScore);

      totalWeightedScore += weightedScore;
      totalWeight += answer.weight.getValue();
    }

    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    const correctCount = answers.filter(a => a.isCorrect()).length;
    const wrongCount = answers.filter(a => a.isWrong()).length;
    const partialCount = answers.filter(a => a.isPartial()).length;

    const percentage = (finalScore / 4) * 100;

    const report: ScoreReport = {
      finalScore,
      percentage,
      correctCount,
      wrongCount,
      partialCount,
      totalQuestions: answers.length,
      weightedScores,
      totalWeight
    };

    this.logger.success(`Final score: ${finalScore.toFixed(2)}/4 (${percentage.toFixed(1)}%)`);

    return report;
  }

  displayReport(report: ScoreReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 QUIZ RESULTS');
    console.log('='.repeat(80) + '\n');

    console.log(`Final Score: ${report.finalScore.toFixed(2)}/4.00 (${report.percentage.toFixed(1)}%)\n`);

    console.log('Breakdown:');
    console.log(`  ✅ Correct:  ${report.correctCount}/${report.totalQuestions}`);
    console.log(`  ⚠️  Partial:  ${report.partialCount}/${report.totalQuestions}`);
    console.log(`  ❌ Wrong:    ${report.wrongCount}/${report.totalQuestions}\n`);

    console.log('Weighted Scores (geometric progression):');
    report.weightedScores.forEach((score, idx) => {
      console.log(`  Q${idx + 1}: ${score.toFixed(3)}`);
    });

    console.log(`\nTotal Weight: ${report.totalWeight.toFixed(3)}`);

    console.log('\n' + this.getGradeEmoji(report.percentage) + ' ' + this.getGradeText(report.percentage));
    console.log('='.repeat(80) + '\n');
  }

  private getGradeEmoji(percentage: number): string {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '📚';
    return '💪';
  }

  private getGradeText(percentage: number): string {
    if (percentage >= 90) return 'Excellent! Outstanding performance!';
    if (percentage >= 80) return 'Great job! Very good understanding!';
    if (percentage >= 70) return 'Good work! Solid grasp of the material!';
    if (percentage >= 60) return 'Fair. Consider reviewing the material.';
    return 'Keep practicing! Review the content and try again.';
  }
}
