import { QuizEvaluator } from '../QuizEvaluator';
import { Quiz } from '../../domain/entities/Quiz';
import { Question } from '../../domain/entities/Question';
import { Url } from '../../domain/value-objects/Url';

describe('QuizEvaluator', () => {
  let evaluator: QuizEvaluator;

  beforeEach(() => {
    evaluator = new QuizEvaluator({
      minQualityScore: 70,
      maxDuplicateAnswerRatio: 0.2,
      minQuestionDiversity: 0.7
    });
  });

  const createQuiz = (questions: Question[]): Quiz => {
    return new Quiz(
      questions,
      'Test Topic',
      Url.create('https://github.com/test/repo/blob/main/README.md')
    );
  };

  describe('evaluateQuestionQuality', () => {
    it('should pass well-formed questions', () => {
      const questions = [
        new Question(
          'What is TypeScript and why is it useful?',
          ['A typed superset of JavaScript', 'A database', 'A framework', 'A browser'],
          [0],
          false,
          'TypeScript adds static typing to JavaScript'
        ),
        new Question(
          'Which features does TypeScript provide?',
          ['Type checking', 'Interfaces', 'Generics', 'All of the above'],
          [3],
          false
        ),
        new Question(
          'How do you compile TypeScript to JavaScript?',
          ['tsc command', 'npm run build', 'Use a bundler', 'All are valid'],
          [3],
          false
        ),
        new Question(
          'What are valid TypeScript types?',
          ['string', 'number', 'boolean', 'All of the above'],
          [3],
          false
        ),
        new Question(
          'Which tools work with TypeScript?',
          ['VS Code', 'ESLint', 'Jest', 'All of the above'],
          [3],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.questionQuality).toBeGreaterThan(80);
      expect(metrics.issues).toHaveLength(0);
    });

    it('should penalize very short questions', () => {
      const questions = [
        new Question(
          'What is TS?',
          ['A language', 'A framework', 'A database', 'A browser'],
          [0],
          false
        ),
        new Question(
          'What is TypeScript?',
          ['A language', 'A framework', 'A database', 'A browser'],
          [0],
          false
        ),
        new Question(
          'What is TypeScript used for?',
          ['Programming', 'Design', 'Testing', 'Deployment'],
          [0],
          false
        ),
        new Question(
          'How do you use TypeScript?',
          ['Install it', 'Write code', 'Compile it', 'All of the above'],
          [3],
          false
        ),
        new Question(
          'Where is TypeScript used?',
          ['Web apps', 'Mobile apps', 'Desktop apps', 'All of the above'],
          [3],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript content here';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.issues.length).toBeGreaterThan(0);
      expect(metrics.issues[0]).toContain('too short');
    });

    it('should penalize very short answers', () => {
      const questions = [
        new Question(
          'What is TypeScript?',
          ['A', 'B', 'C', 'D'],
          [0],
          false
        ),
        new Question(
          'What is TypeScript used for?',
          ['Programming', 'Design', 'Testing', 'Deployment'],
          [0],
          false
        ),
        new Question(
          'How do you use TypeScript?',
          ['Install it', 'Write code', 'Compile it', 'All of the above'],
          [3],
          false
        ),
        new Question(
          'Where is TypeScript used?',
          ['Web apps', 'Mobile apps', 'Desktop apps', 'All of the above'],
          [3],
          false
        ),
        new Question(
          'Why use TypeScript?',
          ['Type safety', 'Better IDE support', 'Catch errors early', 'All of the above'],
          [3],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript content here';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.issues.some(i => i.includes('too short'))).toBe(true);
    });
  });

  describe('evaluateAnswerDistribution', () => {
    it('should detect correct answer position bias', () => {
      const questions = Array.from({ length: 5 }, (_, i) =>
        new Question(
          `Question ${i + 1} about TypeScript?`,
          ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
          [0],
          false
        )
      );

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript content';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.warnings.some(w => w.includes('position bias'))).toBe(true);
    });

    it('should detect duplicate answers', () => {
      const questions = [
        new Question(
          'What is TypeScript?',
          ['Language', 'Language', 'Database', 'Browser'],
          [0],
          false
        ),
        new Question(
          'What is JavaScript?',
          ['Language', 'Framework', 'Database', 'Browser'],
          [0],
          false
        ),
        new Question(
          'What is Python?',
          ['Language', 'Framework', 'Database', 'Browser'],
          [0],
          false
        ),
        new Question(
          'What is Java?',
          ['Language', 'Framework', 'Database', 'Browser'],
          [0],
          false
        ),
        new Question(
          'What is C++?',
          ['Language', 'Framework', 'Database', 'Browser'],
          [0],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'Programming languages content';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.issues.some(i => i.includes('Duplicate'))).toBe(true);
    });

    it('should value mix of single and multiple choice', () => {
      const questions = [
        new Question(
          'What is TypeScript?',
          ['A language', 'A framework', 'A database', 'A browser'],
          [0],
          false
        ),
        new Question(
          'Which are valid TypeScript features?',
          ['Types', 'Interfaces', 'Generics', 'Classes'],
          [0, 1, 2, 3],
          true
        ),
        new Question(
          'How do you compile TypeScript?',
          ['Use tsc', 'Use babel', 'Use webpack', 'Use rollup'],
          [0],
          false
        ),
        new Question(
          'Which are TypeScript primitive types?',
          ['string', 'number', 'boolean', 'object'],
          [0, 1, 2],
          true
        ),
        new Question(
          'What command installs TypeScript?',
          ['npm install typescript', 'yarn add typescript', 'pnpm add typescript', 'All work'],
          [3],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript programming language';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.answerDistribution).toBeGreaterThan(80);
    });
  });

  describe('evaluateContentRelevance', () => {
    it('should pass when questions match source content', () => {
      const questions = [
        new Question(
          'What is TypeScript according to the documentation?',
          ['A typed superset of JavaScript', 'A database', 'A framework', 'A browser'],
          [0],
          false
        ),
        new Question(
          'How does TypeScript compile to JavaScript?',
          ['Using the tsc compiler', 'Automatically', 'Using Babel', 'Using Webpack'],
          [0],
          false
        ),
        new Question(
          'What are TypeScript interfaces used for?',
          ['Defining object shapes', 'Styling', 'Routing', 'Testing'],
          [0],
          false
        ),
        new Question(
          'Which TypeScript feature provides type safety?',
          ['Static type checking', 'Dynamic typing', 'Weak typing', 'No typing'],
          [0],
          false
        ),
        new Question(
          'How do you install TypeScript?',
          ['npm install typescript', 'download binary', 'use CDN', 'build from source'],
          [0],
          false
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = `
TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.
It provides static type checking, interfaces, and generics.
You can install TypeScript using npm install typescript.
The tsc compiler converts TypeScript code to JavaScript.
      `;

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.contentRelevance).toBeGreaterThan(70);
      expect(metrics.issues.length).toBe(0);
    });

    it('should fail when questions are unrelated to source', () => {
      const questions = Array.from({ length: 5 }, (_, i) =>
        new Question(
          `What is quantum physics principle ${i + 1}?`,
          ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
          [0],
          false
        )
      );

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript is a programming language for JavaScript';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.contentRelevance).toBeLessThan(50);
      expect(metrics.issues.some(i => i.includes('Low content relevance'))).toBe(true);
    });
  });

  describe('overall evaluation', () => {
    it('should pass high-quality quiz', () => {
      const questions = [
        new Question(
          'What is TypeScript and why is it useful?',
          ['A typed superset of JavaScript', 'A database system', 'A web framework', 'A testing library'],
          [0],
          false,
          'TypeScript adds static typing to JavaScript'
        ),
        new Question(
          'Which TypeScript features improve code quality?',
          ['Type checking', 'Interfaces', 'Generics', 'All of the above'],
          [3],
          false,
          'All these features help catch errors early'
        ),
        new Question(
          'How do you compile TypeScript to JavaScript?',
          ['Use tsc compiler', 'Use babel only', 'Manual conversion', 'Not possible'],
          [0],
          false,
          'The tsc compiler is the official TypeScript compiler'
        ),
        new Question(
          'Which are valid TypeScript primitive types?',
          ['string', 'number', 'boolean', 'array'],
          [0, 1, 2],
          true,
          'string, number, and boolean are primitive types'
        ),
        new Question(
          'What advantage does TypeScript provide over JavaScript?',
          ['Type safety', 'Faster runtime', 'Smaller bundle size', 'Better SEO'],
          [0],
          false,
          'Type safety catches errors at compile time'
        )
      ];

      const quiz = createQuiz(questions);
      const sourceContent = 'TypeScript is a typed superset of JavaScript that provides type safety through static type checking';

      const metrics = evaluator.evaluate(quiz, sourceContent);

      expect(metrics.passed).toBe(true);
      expect(metrics.overallScore).toBeGreaterThan(70);
    });
  });
});
