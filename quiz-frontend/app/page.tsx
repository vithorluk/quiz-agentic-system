'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { api } from '@/lib/api/client';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.generateQuiz(url);

      if (response.success && response.data.quiz) {
        // Store quiz data in sessionStorage
        sessionStorage.setItem('currentQuiz', JSON.stringify(response.data.quiz));
        router.push('/quiz');
      } else {
        setError(response.message || 'Failed to generate quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-xl font-bold text-gray-900">Quiz Generator</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/history')}
          >
            View History
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI-Powered Quiz Generation
          </h2>
          <p className="text-xl text-gray-600">
            Transform any document into an interactive quiz with intelligent question generation and quality evaluation
          </p>
        </div>

        {/* Main Card */}
        <Card className="max-w-2xl mx-auto">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Document URL"
                  type="url"
                  placeholder="https://github.com/user/repo/blob/main/README.md"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  error={error}
                  disabled={isLoading}
                  className="text-lg"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Supported: GitHub README files, documentation pages, and markdown files
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating Quiz...' : 'Generate Quiz'}
              </Button>
            </form>

            {/* Example URLs */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
              <div className="space-y-2">
                {[
                  'https://raw.githubusercontent.com/pipecat-ai/pipecat/main/README.md',
                  'https://raw.githubusercontent.com/microsoft/TypeScript/main/README.md',
                ].map((exampleUrl) => (
                  <button
                    key={exampleUrl}
                    type="button"
                    onClick={() => setUrl(exampleUrl)}
                    className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {exampleUrl}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: '🧠',
              title: 'AI-Powered',
              description: 'Advanced LLM-based question generation with RAG pipeline'
            },
            {
              icon: '✅',
              title: 'Quality Evaluated',
              description: '70%+ quality threshold with 4-metric evaluation system'
            },
            {
              icon: '📊',
              title: 'Smart Scoring',
              description: 'Geometric weight progression with partial credit support'
            }
          ].map((feature) => (
            <Card key={feature.title} hover className="text-center">
              <CardBody>
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center text-gray-500 text-sm">
        <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
        <p className="mt-1">Powered by RAG Pipeline & LLM Quality Evaluation</p>
      </footer>
    </div>
  );
}
