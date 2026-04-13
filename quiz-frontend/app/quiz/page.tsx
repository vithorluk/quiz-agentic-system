'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import type { Quiz, UserAnswer } from '@/lib/api/types';

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load quiz from sessionStorage
    const quizData = sessionStorage.getItem('currentQuiz');
    if (!quizData) {
      router.push('/');
      return;
    }

    try {
      const parsedQuiz = JSON.parse(quizData);
      setQuiz(parsedQuiz);
    } catch {
      router.push('/');
    }
  }, [router]);

  if (!quiz) {
    return <LoadingScreen message="Loading quiz..." />;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const currentAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex);

  const handleAnswer = (selectedAnswers: number[]) => {
    const newAnswers = userAnswers.filter(a => a.questionIndex !== currentQuestionIndex);
    newAnswers.push({
      questionIndex: currentQuestionIndex,
      selectedAnswers
    });
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Store results in sessionStorage
    sessionStorage.setItem('quizResults', JSON.stringify({
      quiz,
      userAnswers
    }));

    // Navigate to results page
    router.push('/results');
  };

  const hasAnsweredCurrent = currentAnswer && currentAnswer.selectedAnswers.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quiz in Progress</h1>
                <p className="text-sm text-gray-600">{quiz.topic}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
                  router.push('/');
                }
              }}
            >
              Quit
            </Button>
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="container mx-auto px-4 py-8">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
          onAnswer={handleAnswer}
        />

        {/* Navigation */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex-1 max-w-xs"
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!hasAnsweredCurrent}
                isLoading={isSubmitting}
                className="flex-1 max-w-xs"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!hasAnsweredCurrent}
                className="flex-1 max-w-xs"
              >
                Next Question
              </Button>
            )}
          </div>

          {/* Answer Status */}
          <div className="mt-6 flex justify-center gap-2">
            {quiz.questions.map((_, index) => {
              const answered = userAnswers.some(a => a.questionIndex === index && a.selectedAnswers.length > 0);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${isCurrent ? 'scale-110' : ''}
                    ${answered
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
