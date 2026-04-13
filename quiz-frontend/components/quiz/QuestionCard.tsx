'use client';

import { useState } from 'react';
import { Card, CardBody } from '../ui/Card';
import type { QuizQuestion } from '@/lib/api/types';

interface QuestionCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedAnswers: number[]) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuestionCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  const handleAnswerClick = (index: number) => {
    if (question.isMultipleChoice) {
      // Multiple choice - toggle selection
      const newSelected = selectedAnswers.includes(index)
        ? selectedAnswers.filter((i) => i !== index)
        : [...selectedAnswers, index];
      setSelectedAnswers(newSelected);
      onAnswer(newSelected);
    } else {
      // Single choice - replace selection
      setSelectedAnswers([index]);
      onAnswer([index]);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardBody className="p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {questionNumber} of {totalQuestions}</span>
            <span>{Math.round((questionNumber / totalQuestions) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Type Badge */}
        {question.isMultipleChoice && (
          <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
            Multiple Choice - Select all that apply
          </div>
        )}

        {/* Question Text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {question.question}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.answers.map((answer, index) => {
            const isSelected = selectedAnswers.includes(index);
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox/Radio */}
                  <div
                    className={`
                      flex items-center justify-center w-6 h-6 rounded
                      ${question.isMultipleChoice ? 'rounded' : 'rounded-full'}
                      ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-2 border-gray-300'
                      }
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Option Letter */}
                  <span className="font-semibold text-gray-700 min-w-[24px]">
                    {optionLetter}.
                  </span>

                  {/* Answer Text */}
                  <span className={`text-gray-900 ${isSelected ? 'font-medium' : ''}`}>
                    {answer}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
