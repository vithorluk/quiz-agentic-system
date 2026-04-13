'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api/client';
import type { QuizSession } from '@/lib/api/types';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.getSessions();

      if (response.success) {
        setSessions(response.data.sessions);
      } else {
        setError(response.message || 'Failed to load sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading quiz history..." />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Quiz History</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
          >
            New Quiz
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Card className="max-w-3xl mx-auto mb-8 border-red-200 bg-red-50">
            <CardBody className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Loading History</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        )}

        {!error && sessions.length === 0 && (
          <Card className="max-w-3xl mx-auto">
            <CardBody className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Quiz History Yet</h2>
              <p className="text-gray-600 mb-6">
                Take your first quiz to see your progress here
              </p>
              <Button onClick={() => router.push('/')}>
                Generate Your First Quiz
              </Button>
            </CardBody>
          </Card>
        )}

        {!error && sessions.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardBody className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {sessions.length}
                  </div>
                  <div className="text-sm text-gray-600">Quizzes Taken</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {Math.round(
                      sessions.reduce((sum, s) => sum + s.finalScore, 0) / sessions.length
                    )}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {sessions.reduce((sum, s) => sum + s.totalQuestions, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </CardBody>
              </Card>
            </div>

            {/* Sessions List */}
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Quizzes</h2>

              {sessions.map((session) => (
                <Card key={session.id} hover>
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {session.topic}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 truncate max-w-md">
                          {session.sourceUrl}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📝 {session.totalQuestions} questions</span>
                          <span>📅 {formatDate(session.completedAt)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div
                          className={`
                            px-4 py-2 rounded-lg border-2 font-bold text-center min-w-[80px]
                            ${getScoreColor(session.finalScore)}
                          `}
                        >
                          <div className="text-2xl">{Math.round(session.finalScore)}%</div>
                          <div className="text-xs mt-1">Score</div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
