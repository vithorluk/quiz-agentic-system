export interface PromptMetadata {
  version: string;
  author: string;
  date: string;
  description: string;
  abTest?: {
    winner: boolean;
    improvement?: string;
  };
}

export interface PromptVersion {
  systemPrompt: string;
  userPromptTemplate: string;
  metadata: PromptMetadata;
}

export const QUIZ_GENERATION_PROMPTS: Record<string, PromptVersion> = {
  'v1.0.0': {
    systemPrompt: `You are an expert quiz generator. Create high-quality, educational quizzes based on the provided content.

Requirements:
- Generate questions based on the content
- Each question must have exactly 4 answer options
- Mark correct answers with their indices (0-3)
- Support both single-choice and multiple-choice questions
- Include explanations for correct answers
- Ensure questions test understanding, not just memorization

Output ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "question": "string (min 10 chars)",
      "answers": ["option1", "option2", "option3", "option4"],
      "correctAnswers": [0],
      "isMultipleChoice": false,
      "explanation": "optional explanation"
    }
  ],
  "topic": "string",
  "sourceUrl": "string"
}`,
    userPromptTemplate: `Generate a quiz about "{{topic}}" based on the following content:

{{context}}

Create {{minQuestions}}-{{maxQuestions}} challenging questions that test deep understanding of the material.`,
    metadata: {
      version: 'v1.0.0',
      author: 'vithor',
      date: '2024-01-15',
      description: 'Initial version'
    }
  },
  'v1.1.0': {
    systemPrompt: `You are an expert quiz generator. Create high-quality, educational quizzes based on the provided content with focus on practical application.

Requirements:
- Generate questions that test practical understanding and real-world application
- Each question must have exactly 4 answer options
- Mark correct answers with their indices (0-3)
- Support both single-choice and multiple-choice questions
- Include explanations that connect concepts to practical use
- Ensure questions encourage critical thinking
- Questions should test comprehension, analysis, and application

Output ONLY valid JSON matching this structure:
{
  "questions": [
    {
      "question": "string (min 10 chars, focus on 'how' and 'why')",
      "answers": ["option1", "option2", "option3", "option4"],
      "correctAnswers": [0],
      "isMultipleChoice": false,
      "explanation": "explanation with practical context"
    }
  ],
  "topic": "string",
  "sourceUrl": "string"
}`,
    userPromptTemplate: `Generate a quiz about "{{topic}}" based on the following content:

{{context}}

Create {{minQuestions}}-{{maxQuestions}} questions that test:
1. Understanding of core concepts
2. Ability to apply knowledge to real scenarios
3. Recognition of best practices and common pitfalls

Focus on practical, actionable knowledge rather than trivia.`,
    metadata: {
      version: 'v1.1.0',
      author: 'vithor',
      date: '2024-04-16',
      description: 'Added emphasis on real-world scenarios and practical application',
      abTest: {
        winner: true,
        improvement: '+12% quality score'
      }
    }
  }
};

export const CURRENT_VERSION = 'v1.1.0';

export function getPromptVersion(version: string = CURRENT_VERSION): PromptVersion {
  const prompt = QUIZ_GENERATION_PROMPTS[version];
  if (!prompt) {
    throw new Error(`Prompt version ${version} not found`);
  }
  return prompt;
}

export function renderUserPrompt(template: string, vars: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}
