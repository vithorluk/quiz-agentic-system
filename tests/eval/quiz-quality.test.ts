import { QuizOrchestrator } from '../../src/application/QuizOrchestrator.js';
import { ServiceFactory } from '../../src/application/ServiceFactory.js';

/**
 * Evaluation Regression Tests
 *
 * These tests validate the end-to-end quality of quiz generation using real documents.
 * They ensure that changes to the RAG pipeline, LLM prompts, or evaluation metrics
 * don't degrade quiz quality over time.
 *
 * Test Strategy:
 * - Use real markdown documents from public repos
 * - Validate quiz quality metrics meet thresholds
 * - Check for common failure modes (duplicate questions, poor difficulty distribution)
 * - Ensure evaluation consistency across runs
 */

describe('Quiz Quality Regression Tests', () => {
  let orchestrator: QuizOrchestrator;

  beforeAll(() => {
    orchestrator = ServiceFactory.createOrchestrator();
  });

  describe('Technical Documentation', () => {
    it('should generate high-quality quiz from technical README', async () => {
      // Using a well-structured technical README
      const testUrl = 'https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md';

      const result = await orchestrator.generateQuiz(testUrl);

      // Basic quiz structure validation
      expect(result).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions.length).toBeGreaterThanOrEqual(5);
      expect(result.quiz.questions.length).toBeLessThanOrEqual(8);

      // Evaluate quiz quality (already done by orchestrator)
      const evaluation = result.evaluation!;
      expect(evaluation).toBeDefined();

      // Quality thresholds (note: scores are 0-100, not 0-1)
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
      expect(evaluation.passed).toBe(true);

      // Individual metric validation
      expect(evaluation.questionQuality).toBeGreaterThanOrEqual(60);
      expect(evaluation.answerDistribution).toBeGreaterThanOrEqual(60);
      expect(evaluation.difficultyBalance).toBeGreaterThanOrEqual(50);

      // Structural validation
      result.quiz.questions.forEach((question) => {
        expect(question.text.trim()).toBeTruthy();
        expect(question.text.length).toBeGreaterThan(10);
        expect(question.answers.length).toBe(4);
        expect(question.correctAnswers.length).toBeGreaterThanOrEqual(1);

        // Ensure correct answers are valid indices
        question.correctAnswers.forEach(answerIdx => {
          expect(answerIdx).toBeGreaterThanOrEqual(0);
          expect(answerIdx).toBeLessThan(question.answers.length);
        });
      });

      // Log evaluation details for debugging
      if (!evaluation.passed || evaluation.issues.length > 0) {
        console.log('Evaluation Issues:', evaluation.issues);
        console.log('Evaluation Warnings:', evaluation.warnings);
      }
    }, 60000);

    it('should handle short documentation gracefully', async () => {
      // Test with a shorter README to ensure quality isn't dependent on length
      const testUrl = 'https://raw.githubusercontent.com/sindresorhus/is/main/readme.md';

      const result = await orchestrator.generateQuiz(testUrl);

      expect(result).toBeDefined();
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions.length).toBeGreaterThanOrEqual(5);

      const evaluation = result.evaluation!;
      expect(evaluation).toBeDefined();

      // Slightly lower threshold for shorter docs
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(65);

      // Should still maintain good question quality
      expect(evaluation.questionQuality).toBeGreaterThanOrEqual(60);
    }, 60000);
  });

  describe('Common Failure Modes', () => {
    it('should not generate duplicate questions', async () => {
      const testUrl = 'https://raw.githubusercontent.com/expressjs/express/master/Readme.md';

      const result = await orchestrator.generateQuiz(testUrl);
      const quiz = result.quiz;

      // Check for duplicate questions (exact matches)
      const questionTexts = quiz.questions.map(q => q.text.toLowerCase().trim());
      const uniqueQuestions = new Set(questionTexts);

      expect(uniqueQuestions.size).toBe(questionTexts.length);

      // Check for near-duplicates (similar first 50 chars)
      const questionPrefixes = questionTexts.map(q => q.substring(0, 50));
      const uniquePrefixes = new Set(questionPrefixes);

      // Allow for 1 similar prefix in edge cases
      expect(uniquePrefixes.size).toBeGreaterThanOrEqual(questionTexts.length - 1);
    }, 60000);

    it('should not have all answers in same position', async () => {
      const testUrl = 'https://raw.githubusercontent.com/nodejs/node/main/README.md';

      const result = await orchestrator.generateQuiz(testUrl);
      const quiz = result.quiz;

      // Check that correct answers aren't all position 0 (or any single position)
      const correctPositions = quiz.questions
        .filter(q => q.correctAnswers.length === 1)
        .map(q => q.correctAnswers[0]);

      if (correctPositions.length >= 3) {
        const positionCounts = correctPositions.reduce((acc, pos) => {
          acc[pos] = (acc[pos] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const maxPositionCount = Math.max(...Object.values(positionCounts));
        const positionBiasRatio = maxPositionCount / correctPositions.length;

        // No single position should have more than 50% of answers
        expect(positionBiasRatio).toBeLessThanOrEqual(0.5);
      }
    }, 60000);

    it('should have reasonable difficulty distribution', async () => {
      const testUrl = 'https://raw.githubusercontent.com/facebook/react/main/README.md';

      const result = await orchestrator.generateQuiz(testUrl);
      const quiz = result.quiz;

      const singleChoiceCount = quiz.questions.filter(q => !q.isMultipleChoice).length;
      const multiChoiceCount = quiz.questions.filter(q => q.isMultipleChoice).length;

      // Should have a mix of both types (not all easy or all hard)
      expect(singleChoiceCount).toBeGreaterThanOrEqual(1);
      expect(multiChoiceCount).toBeGreaterThanOrEqual(1);

      // Ratio should be reasonable (not too skewed)
      const totalQuestions = quiz.questions.length;
      const singleChoiceRatio = singleChoiceCount / totalQuestions;

      expect(singleChoiceRatio).toBeGreaterThanOrEqual(0.3);
      expect(singleChoiceRatio).toBeLessThanOrEqual(0.9);
    }, 60000);
  });

  describe('Content Relevance', () => {
    it('should generate questions relevant to source content', async () => {
      const testUrl = 'https://raw.githubusercontent.com/vuejs/core/main/README.md';

      const result = await orchestrator.generateQuiz(testUrl);
      const quiz = result.quiz;
      const evaluation = result.evaluation!;

      // Content relevance should be high (scores are 0-100)
      expect(evaluation.contentRelevance).toBeGreaterThanOrEqual(60);

      // Questions should contain topic-relevant keywords
      const allQuestionText = quiz.questions
        .map(q => q.text + ' ' + q.answers.join(' '))
        .join(' ')
        .toLowerCase();

      // Should contain some framework-specific terms (this is Vue.js README)
      const hasRelevantContent =
        allQuestionText.includes('vue') ||
        allQuestionText.includes('component') ||
        allQuestionText.includes('reactive') ||
        allQuestionText.includes('template');

      expect(hasRelevantContent).toBe(true);
    }, 60000);
  });

  describe('Evaluation Consistency', () => {
    it('should produce consistent evaluations for same quiz', () => {
      const evaluator = ServiceFactory.createEvaluator();

      // Create a mock quiz with known characteristics
      const mockQuiz = {
        questions: [
          {
            text: 'What is the primary purpose of TypeScript?',
            answers: ['Runtime performance', 'Type safety', 'Smaller bundle size', 'Better SEO'],
            correctAnswers: [1],
            isMultipleChoice: false
          },
          {
            text: 'Which of the following are TypeScript features?',
            answers: ['Interfaces', 'Generics', 'Type inference', 'Type erasure'],
            correctAnswers: [0, 1, 2],
            isMultipleChoice: true
          },
          {
            text: 'How do you compile TypeScript to JavaScript?',
            answers: ['Use tsc command', 'Use node command', 'Use npm command', 'No compilation needed'],
            correctAnswers: [0],
            isMultipleChoice: false
          },
          {
            text: 'What file extensions do TypeScript files use?',
            answers: ['.js', '.ts', '.tsx', '.typescript'],
            correctAnswers: [1, 2],
            isMultipleChoice: true
          },
          {
            text: 'Is TypeScript a superset of JavaScript?',
            answers: ['Yes', 'No', 'Maybe', 'It depends'],
            correctAnswers: [0],
            isMultipleChoice: false
          }
        ],
        topic: 'TypeScript'
      };

      const sourceContent = 'TypeScript is a strongly typed programming language that builds on JavaScript. It provides static typing, interfaces, generics, and type inference.';

      // Run evaluation multiple times
      const eval1 = evaluator.evaluate(mockQuiz as any, sourceContent);
      const eval2 = evaluator.evaluate(mockQuiz as any, sourceContent);
      const eval3 = evaluator.evaluate(mockQuiz as any, sourceContent);

      // Should produce identical results
      expect(eval1.overallScore).toBe(eval2.overallScore);
      expect(eval2.overallScore).toBe(eval3.overallScore);
      expect(eval1.passed).toBe(eval2.passed);
      expect(eval1.questionQuality).toBe(eval2.questionQuality);
      expect(eval1.answerDistribution).toBe(eval2.answerDistribution);
      expect(eval1.difficultyBalance).toBe(eval2.difficultyBalance);
      expect(eval1.contentRelevance).toBe(eval2.contentRelevance);
    });
  });
});
