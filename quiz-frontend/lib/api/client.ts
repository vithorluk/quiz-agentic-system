import type { GenerateQuizResponse, SessionsResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  async generateQuiz(url: string): Promise<GenerateQuizResponse> {
    return fetchApi<GenerateQuizResponse>('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async getSessions(): Promise<SessionsResponse> {
    return fetchApi<SessionsResponse>('/api/sessions');
  },

  async getSession(id: string) {
    return fetchApi(`/api/sessions/${id}`);
  },

  async getSessionsByTopic(topic: string): Promise<SessionsResponse> {
    return fetchApi<SessionsResponse>(`/api/sessions/topic/${encodeURIComponent(topic)}`);
  },

  async healthCheck() {
    return fetchApi('/health');
  },
};
