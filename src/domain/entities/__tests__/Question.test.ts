import { Question } from '../Question';

describe('Question Entity', () => {
  describe('validation', () => {
    it('should create valid question', () => {
      const question = new Question(
        'What is TypeScript?',
        ['A language', 'A framework', 'A database', 'A browser'],
        [0],
        false
      );

      expect(question.text).toBe('What is TypeScript?');
      expect(question.answers).toHaveLength(4);
    });

    it('should reject question with too short text', () => {
      expect(() => new Question(
        'Short',
        ['A', 'B', 'C', 'D'],
        [0],
        false
      )).toThrow('Question text must be at least 10 characters');
    });

    it('should reject question without exactly 4 answers', () => {
      expect(() => new Question(
        'What is this?',
        ['A', 'B', 'C'],
        [0],
        false
      )).toThrow('Question must have exactly 4 answers');
    });

    it('should reject question without correct answers', () => {
      expect(() => new Question(
        'What is this?',
        ['A', 'B', 'C', 'D'],
        [],
        false
      )).toThrow('Question must have at least one correct answer');
    });

    it('should reject duplicate correct answer indices', () => {
      expect(() => new Question(
        'What is this?',
        ['A', 'B', 'C', 'D'],
        [0, 0],
        true
      )).toThrow('Correct answers must be unique');
    });

    it('should reject multiple choice with single correct answer', () => {
      expect(() => new Question(
        'What is this?',
        ['A', 'B', 'C', 'D'],
        [0],
        true
      )).toThrow('Multiple choice question must have more than one correct answer');
    });

    it('should reject single choice with multiple correct answers', () => {
      expect(() => new Question(
        'What is this?',
        ['A', 'B', 'C', 'D'],
        [0, 1],
        false
      )).toThrow('Single choice question cannot have multiple correct answers');
    });
  });

  describe('isCorrect', () => {
    it('should return true for correct single answer', () => {
      const question = new Question(
        'What is 2+2?',
        ['3', '4', '5', '6'],
        [1],
        false
      );

      expect(question.isCorrect([1])).toBe(true);
    });

    it('should return false for wrong single answer', () => {
      const question = new Question(
        'What is 2+2?',
        ['3', '4', '5', '6'],
        [1],
        false
      );

      expect(question.isCorrect([0])).toBe(false);
    });

    it('should return true for all correct multiple answers', () => {
      const question = new Question(
        'Which are even?',
        ['2', '3', '4', '5'],
        [0, 2],
        true
      );

      expect(question.isCorrect([0, 2])).toBe(true);
      expect(question.isCorrect([2, 0])).toBe(true);
    });

    it('should return false for partial multiple answers', () => {
      const question = new Question(
        'Which are even?',
        ['2', '3', '4', '5'],
        [0, 2],
        true
      );

      expect(question.isCorrect([0])).toBe(false);
      expect(question.isCorrect([0, 1])).toBe(false);
    });
  });

  describe('getPartialCredit', () => {
    it('should return 1 for correct single choice', () => {
      const question = new Question(
        'What is 2+2?',
        ['3', '4', '5', '6'],
        [1],
        false
      );

      expect(question.getPartialCredit([1])).toBe(1);
    });

    it('should return 0 for wrong single choice', () => {
      const question = new Question(
        'What is 2+2?',
        ['3', '4', '5', '6'],
        [1],
        false
      );

      expect(question.getPartialCredit([0])).toBe(0);
    });

    it('should return 1 for all correct multiple choice', () => {
      const question = new Question(
        'Which are even?',
        ['2', '3', '4', '5'],
        [0, 2],
        true
      );

      expect(question.getPartialCredit([0, 2])).toBe(1);
    });

    it('should return 0.5 for half correct multiple choice', () => {
      const question = new Question(
        'Which are even?',
        ['2', '3', '4', '5'],
        [0, 2],
        true
      );

      expect(question.getPartialCredit([0])).toBe(0.5);
      expect(question.getPartialCredit([2])).toBe(0.5);
    });

    it('should return 0.67 for 2/3 correct multiple choice', () => {
      const question = new Question(
        'Select primes',
        ['2', '3', '4', '5'],
        [0, 1, 3],
        true
      );

      const credit = question.getPartialCredit([0, 1]);
      expect(credit).toBeCloseTo(0.667, 2);
    });

    it('should return 0 if no correct selections in multiple choice', () => {
      const question = new Question(
        'Which are even?',
        ['2', '3', '4', '5'],
        [0, 2],
        true
      );

      expect(question.getPartialCredit([1, 3])).toBe(0);
    });
  });

  describe('with explanations', () => {
    it('should store explanation', () => {
      const question = new Question(
        'What is TypeScript?',
        ['A language', 'A framework', 'A database', 'A browser'],
        [0],
        false,
        'TypeScript is a typed superset of JavaScript'
      );

      expect(question.explanation).toBe('TypeScript is a typed superset of JavaScript');
    });

    it('should work without explanation', () => {
      const question = new Question(
        'What is TypeScript?',
        ['A language', 'A framework', 'A database', 'A browser'],
        [0],
        false
      );

      expect(question.explanation).toBeUndefined();
    });
  });
});
