import { ScorerAgent } from '../ScorerAgent';
import { QuizAnswer } from '../../domain/entities/QuizAnswer';
import { Score } from '../../domain/value-objects/Score';
import { Weight } from '../../domain/value-objects/Weight';

describe('ScorerAgent', () => {
  let scorer: ScorerAgent;

  beforeEach(() => {
    scorer = new ScorerAgent();
  });

  describe('calculate', () => {
    it('should calculate perfect score for all correct answers', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [1], [1], Score.perfect(), Weight.forQuestion(1)),
        new QuizAnswer(2, [2], [2], Score.perfect(), Weight.forQuestion(2)),
      ];

      const report = scorer.calculate(answers);

      expect(report.finalScore).toBeCloseTo(4.0, 5);
      expect(report.percentage).toBeCloseTo(100, 5);
      expect(report.correctCount).toBe(3);
      expect(report.wrongCount).toBe(0);
      expect(report.partialCount).toBe(0);
    });

    it('should calculate zero score for all wrong answers', () => {
      const answers = [
        new QuizAnswer(0, [1], [0], Score.zero(), Weight.forQuestion(0)),
        new QuizAnswer(1, [2], [1], Score.zero(), Weight.forQuestion(1)),
        new QuizAnswer(2, [3], [2], Score.zero(), Weight.forQuestion(2)),
      ];

      const report = scorer.calculate(answers);

      expect(report.finalScore).toBe(0);
      expect(report.percentage).toBe(0);
      expect(report.correctCount).toBe(0);
      expect(report.wrongCount).toBe(3);
      expect(report.partialCount).toBe(0);
    });

    it('should handle partial credit correctly', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [0, 1], [0, 1, 2], Score.partial(2, 3), Weight.forQuestion(1)),
        new QuizAnswer(2, [1], [0], Score.zero(), Weight.forQuestion(2)),
      ];

      const report = scorer.calculate(answers);

      expect(report.correctCount).toBe(1);
      expect(report.partialCount).toBe(1);
      expect(report.wrongCount).toBe(1);
    });

    it('should apply geometric weights correctly in final score calculation', () => {
      const w0 = Weight.forQuestion(0).getValue();
      const w1 = Weight.forQuestion(1).getValue();
      const totalWeight = w0 + w1;

      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [1], [0], Score.zero(), Weight.forQuestion(1)),
      ];

      const expectedScore = (4 * w0 + 0 * w1) / totalWeight;
      const report = scorer.calculate(answers);

      expect(report.finalScore).toBeCloseTo(expectedScore, 5);
    });

    it('should give higher weight to later questions', () => {
      const answers1 = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [1], [0], Score.zero(), Weight.forQuestion(1)),
      ];

      const answers2 = [
        new QuizAnswer(0, [1], [0], Score.zero(), Weight.forQuestion(0)),
        new QuizAnswer(1, [0], [0], Score.perfect(), Weight.forQuestion(1)),
      ];

      const report1 = scorer.calculate(answers1);
      const report2 = scorer.calculate(answers2);

      expect(report2.finalScore).toBeGreaterThan(report1.finalScore);
    });

    it('should calculate weighted scores correctly', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.create(4), Weight.forQuestion(0)),
        new QuizAnswer(1, [0], [0], Score.create(2), Weight.forQuestion(1)),
        new QuizAnswer(2, [0], [0], Score.create(3), Weight.forQuestion(2)),
      ];

      const report = scorer.calculate(answers);

      expect(report.weightedScores).toHaveLength(3);
      expect(report.weightedScores[0]).toBeCloseTo(4.0, 5);
      expect(report.weightedScores[1]).toBeCloseTo(2.2, 5);
      expect(report.weightedScores[2]).toBeCloseTo(3.63, 2);
    });

    it('should match mathematical formula: final_score = Σ(score_i × weight_i) / Σ(weight_i)', () => {
      const scores = [4, 2, 3, 4, 1];
      const answers = scores.map((score, i) =>
        new QuizAnswer(i, [0], [0], Score.create(score), Weight.forQuestion(i))
      );

      const totalWeighted = scores.reduce((sum, score, i) =>
        sum + score * Weight.forQuestion(i).getValue(), 0
      );
      const totalWeight = scores.reduce((sum, _, i) =>
        sum + Weight.forQuestion(i).getValue(), 0
      );
      const expected = totalWeighted / totalWeight;

      const report = scorer.calculate(answers);

      expect(report.finalScore).toBeCloseTo(expected, 5);
    });

    it('should calculate percentage correctly', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.create(2), Weight.forQuestion(0)),
      ];

      const report = scorer.calculate(answers);

      expect(report.percentage).toBeCloseTo(50, 5);
    });

    it('should store total weight correctly', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [0], [0], Score.perfect(), Weight.forQuestion(1)),
        new QuizAnswer(2, [0], [0], Score.perfect(), Weight.forQuestion(2)),
      ];

      const expectedTotal = Weight.forQuestion(0).getValue() +
                           Weight.forQuestion(1).getValue() +
                           Weight.forQuestion(2).getValue();

      const report = scorer.calculate(answers);

      expect(report.totalWeight).toBeCloseTo(expectedTotal, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty answers array', () => {
      const report = scorer.calculate([]);

      expect(report.finalScore).toBe(0);
      expect(report.correctCount).toBe(0);
      expect(report.totalQuestions).toBe(0);
    });

    it('should handle single answer', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
      ];

      const report = scorer.calculate(answers);

      expect(report.finalScore).toBe(4);
      expect(report.totalQuestions).toBe(1);
    });

    it('should handle maximum questions (8)', () => {
      const answers = Array.from({ length: 8 }, (_, i) =>
        new QuizAnswer(i, [0], [0], Score.perfect(), Weight.forQuestion(i))
      );

      const report = scorer.calculate(answers);

      expect(report.finalScore).toBe(4);
      expect(report.totalQuestions).toBe(8);
    });
  });

  describe('scoring scenarios', () => {
    it('should score 50-50 mix correctly', () => {
      const answers = [
        new QuizAnswer(0, [0], [0], Score.perfect(), Weight.forQuestion(0)),
        new QuizAnswer(1, [0], [0], Score.perfect(), Weight.forQuestion(1)),
        new QuizAnswer(2, [1], [0], Score.zero(), Weight.forQuestion(2)),
        new QuizAnswer(3, [1], [0], Score.zero(), Weight.forQuestion(3)),
      ];

      const report = scorer.calculate(answers);

      expect(report.correctCount).toBe(2);
      expect(report.wrongCount).toBe(2);
    });

    it('should handle all partial credit scenario', () => {
      const answers = [
        new QuizAnswer(0, [0, 1], [0, 1, 2], Score.partial(2, 3), Weight.forQuestion(0)),
        new QuizAnswer(1, [0], [0, 1], Score.partial(1, 2), Weight.forQuestion(1)),
      ];

      const report = scorer.calculate(answers);

      expect(report.partialCount).toBe(2);
      expect(report.finalScore).toBeLessThan(4);
      expect(report.finalScore).toBeGreaterThan(0);
    });
  });
});
