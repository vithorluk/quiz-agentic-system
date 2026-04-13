'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import type { Quiz, UserAnswer } from '@/lib/api/types';

interface QuizResults {
  quiz: Quiz;
  userAnswers: UserAnswer[];
}

export default function ResultsPage() {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [score, setScore] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Load results from sessionStorage
    const resultsData = sessionStorage.getItem('quizResults');
    if (!resultsData) {
      router.push('/');
      return;
    }

    try {
      const parsedResults = JSON.parse(resultsData);
      setResults(parsedResults);

      // Calculate score (simple for now - just count answered questions)
      const answeredCount = parsedResults.userAnswers.filter(
        (a: UserAnswer) => a.selectedAnswers.length > 0
      ).length;
      const percentage = (answeredCount / parsedResults.quiz.questions.length) * 100;
      setScore(percentage);
    } catch {
      router.push('/');
    }
  }, [router]);

  if (!results) {
    return <LoadingScreen message="Loading results..." />;
  }

  const { quiz, userAnswers } = results;

  // Calculate statistics
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = userAnswers.filter(a => a.selectedAnswers.length > 0).length;
  const multipleChoiceCount = quiz.questions.filter(q => q.isMultipleChoice).length;
  const singleChoiceCount = totalQuestions - multipleChoiceCount;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (score >= 90) return 'Outstanding! 🎉';
    if (score >= 80) return 'Excellent work! 🌟';
    if (score >= 70) return 'Great job! 👍';
    if (score >= 60) return 'Good effort! 💪';
    return 'Keep practicing! 📚';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score Card */}
        <Card className="max-w-3xl mx-auto mb-8">
          <CardBody className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{getScoreMessage()}</h2>

            {/* Circular Progress */}
            <div className="relative inline-flex items-center justify-center w-48 h-48 mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - score / 100)}
                  className={`${getScoreColor()} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold ${getScoreColor()}`}>
                  {Math.round(score)}%
                </span>
                <span className="text-gray-600 text-sm mt-1">Complete</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{quiz.topic}</h3>
            <p className="text-gray-600">
              You answered {answeredQuestions} out of {totalQuestions} questions
            </p>
          </CardBody>
        </Card>

        {/* Statistics */}
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {singleChoiceCount}
              </div>
              <div className="text-sm text-gray-600">Single Choice</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {multipleChoiceCount}
              </div>
              <div className="text-sm text-gray-600">Multiple Choice</div>
            </CardBody>
          </Card>
        </div>

        {/* Question Review */}
        <Card className="max-w-3xl mx-auto mb-8">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Your Answers</h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = userAnswers.find(a => a.questionIndex === index);
                const selectedIndices = userAnswer?.selectedAnswers || [];

                return (
                  <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                        <div className="space-y-2">
                          {question.answers.map((answer, answerIndex) => {
                            const isSelected = selectedIndices.includes(answerIndex);
                            const optionLetter = String.fromCharCode(65 + answerIndex);

                            return (
                              <div
                                key={answerIndex}
                                className={`
                                  p-3 rounded-lg
                                  ${isSelected
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 border-2 border-gray-200'
                                  }
                                `}
                              >
                                <span className="font-medium text-gray-700">
                                  {optionLetter}.
                                </span>{' '}
                                <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                                  {answer}
                                </span>
                                {isSelected && (
                                  <span className="ml-2 text-blue-600">✓ Selected</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="max-w-3xl mx-auto flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            Generate New Quiz
          </Button>
          <Button
            onClick={() => router.push('/history')}
            className="flex-1"
          >
            View History
          </Button>
        </div>
      </main>
    </div>
  );
}
