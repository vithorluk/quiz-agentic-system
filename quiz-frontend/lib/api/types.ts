export interface QuizQuestion {
  question: string;
  answers: string[];
  isMultipleChoice: boolean;
}

export interface Quiz {
  topic: string;
  sourceUrl: string;
  questionCount: number;
  questions: QuizQuestion[];
}

export interface GenerateQuizResponse {
  success: boolean;
  data: {
    quiz: Quiz;
  };
  error?: string;
  message?: string;
}

export interface QuizSession {
  id: string;
  topic: string;
  sourceUrl: string;
  totalQuestions: number;
  finalScore: number;
  completedAt: string;
}

export interface SessionsResponse {
  success: boolean;
  data: {
    sessions: QuizSession[];
  };
  error?: string;
  message?: string;
}

export interface UserAnswer {
  questionIndex: number;
  selectedAnswers: number[];
}
