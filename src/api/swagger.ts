import swaggerJsdoc from 'swagger-jsdoc';

// Determine the server URL based on environment
const getServers = () => {
  const servers = [];
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER_EXTERNAL_URL;

  // Add production server if RENDER_EXTERNAL_URL is set (Render deployment)
  if (process.env.RENDER_EXTERNAL_URL) {
    servers.push({
      url: process.env.RENDER_EXTERNAL_URL,
      description: 'Production server (Render)',
    });
  }

  // Add custom production URL if set
  if (process.env.PRODUCTION_URL) {
    servers.push({
      url: process.env.PRODUCTION_URL,
      description: 'Production server',
    });
  }

  // Only add localhost in development (not in production)
  if (!isProduction) {
    const port = process.env.PORT || '3000';
    servers.push({
      url: `http://localhost:${port}`,
      description: 'Development server',
    });
  }

  // Fallback to localhost if no servers configured
  return servers.length > 0 ? servers : [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    }
  ];
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quiz Agent System API',
      version: '1.0.0',
      description: 'AI-powered quiz generation system with RAG pipeline',
      contact: {
        name: 'Quiz Agent System',
        url: 'https://github.com/yourusername/quiz-agentic-system',
      },
    },
    servers: getServers(),
    components: {
      schemas: {
        Question: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The quiz question text',
            },
            answers: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of answer options',
            },
            isMultipleChoice: {
              type: 'boolean',
              description: 'Whether this is a multiple choice question',
            },
          },
          required: ['question', 'answers', 'isMultipleChoice'],
        },
        Quiz: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The main topic of the quiz',
            },
            sourceUrl: {
              type: 'string',
              description: 'The URL from which the quiz content was generated',
            },
            questionCount: {
              type: 'integer',
              description: 'Total number of questions in the quiz',
            },
            questions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Question',
              },
            },
          },
          required: ['topic', 'sourceUrl', 'questionCount', 'questions'],
        },
        QuizResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                quiz: {
                  $ref: '#/components/schemas/Quiz',
                },
              },
            },
          },
        },
        QuizAnswer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sessionId: {
              type: 'string',
              format: 'uuid',
            },
            questionIndex: {
              type: 'integer',
            },
            questionText: {
              type: 'string',
            },
            userAnswers: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            correctAnswers: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            score: {
              type: 'number',
              format: 'float',
            },
            weight: {
              type: 'number',
              format: 'float',
            },
            isCorrect: {
              type: 'boolean',
            },
            isPartial: {
              type: 'boolean',
            },
          },
        },
        QuizSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            url: {
              type: 'string',
            },
            topic: {
              type: 'string',
            },
            finalScore: {
              type: 'number',
              format: 'float',
            },
            percentage: {
              type: 'number',
              format: 'float',
            },
            correctCount: {
              type: 'integer',
            },
            wrongCount: {
              type: 'integer',
            },
            partialCount: {
              type: 'integer',
            },
            totalQuestions: {
              type: 'integer',
            },
            createdAt: {
              type: 'integer',
            },
            answers: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/QuizAnswer',
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            version: {
              type: 'string',
            },
          },
        },
        QuestionData: {
          type: 'object',
          properties: {
            questionIndex: {
              type: 'integer',
              description: 'Index of the question (0-based)',
            },
            questionText: {
              type: 'string',
              description: 'The question text',
            },
            answers: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of answer options',
            },
            isMultipleChoice: {
              type: 'boolean',
              description: 'Whether this is a multiple choice question',
            },
          },
          required: ['questionIndex', 'questionText', 'answers', 'isMultipleChoice'],
        },
        QuizData: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              format: 'uuid',
              description: 'The quiz session ID',
            },
            topic: {
              type: 'string',
              description: 'The main topic of the quiz',
            },
            sourceUrl: {
              type: 'string',
              description: 'The URL from which the quiz was generated',
            },
            questionCount: {
              type: 'integer',
              description: 'Total number of questions in the quiz',
            },
            questions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/QuestionData',
              },
              description: 'Array of quiz questions',
            },
          },
          required: ['sessionId', 'topic', 'sourceUrl', 'questionCount', 'questions'],
        },
        AnswerResult: {
          type: 'object',
          properties: {
            isCorrect: {
              type: 'boolean',
              description: 'Whether the answer was fully correct',
            },
            isPartial: {
              type: 'boolean',
              description: 'Whether the answer was partially correct',
            },
            score: {
              type: 'number',
              format: 'float',
              description: 'Score for this answer (0-4)',
            },
            correctAnswers: {
              type: 'array',
              items: {
                type: 'integer',
              },
              description: 'Indices of the correct answers',
            },
            explanation: {
              type: 'string',
              description: 'Optional explanation for the correct answer',
            },
          },
          required: ['isCorrect', 'isPartial', 'score', 'correctAnswers'],
        },
        ScoreReport: {
          type: 'object',
          properties: {
            finalScore: {
              type: 'number',
              format: 'float',
              description: 'Final weighted score (0-4)',
            },
            percentage: {
              type: 'number',
              format: 'float',
              description: 'Percentage score (0-100)',
            },
            correctCount: {
              type: 'integer',
              description: 'Number of fully correct answers',
            },
            wrongCount: {
              type: 'integer',
              description: 'Number of wrong answers',
            },
            partialCount: {
              type: 'integer',
              description: 'Number of partially correct answers',
            },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionIndex: {
                    type: 'integer',
                  },
                  score: {
                    type: 'number',
                    format: 'float',
                  },
                  weight: {
                    type: 'number',
                    format: 'float',
                  },
                  weightedScore: {
                    type: 'number',
                    format: 'float',
                  },
                },
              },
              description: 'Detailed breakdown per question',
            },
          },
          required: ['finalScore', 'percentage', 'correctCount', 'wrongCount', 'partialCount', 'breakdown'],
        },
      },
    },
    paths: {
      '/api/quiz/generate': {
        post: {
          tags: ['Quiz Generation'],
          summary: 'Generate a quiz from a URL',
          description: 'Takes a URL (markdown or webpage) and generates an interactive quiz with RAG-powered content extraction',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://raw.githubusercontent.com/pipecat-ai/pipecat/main/README.md',
                      description: 'The URL to generate quiz from (must be whitelisted)',
                    },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Quiz generated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/QuizResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request - URL is required',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Server error - Quiz generation failed',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/sessions': {
        get: {
          tags: ['Quiz Sessions'],
          summary: 'Get all quiz sessions',
          description: 'Retrieve all saved quiz sessions from the database',
          responses: {
            '200': {
              description: 'List of all quiz sessions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        type: 'object',
                        properties: {
                          sessions: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/QuizSession',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Failed to fetch sessions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/sessions/{id}': {
        get: {
          tags: ['Quiz Sessions'],
          summary: 'Get a specific quiz session',
          description: 'Retrieve details of a specific quiz session by ID, including all answers and scoring',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
              },
              description: 'The quiz session ID',
            },
          ],
          responses: {
            '200': {
              description: 'Quiz session found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        type: 'object',
                        properties: {
                          session: {
                            $ref: '#/components/schemas/QuizSession',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Session not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Failed to fetch session',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/sessions/topic/{topic}': {
        get: {
          tags: ['Quiz Sessions'],
          summary: 'Get sessions by topic',
          description: 'Retrieve all quiz sessions for a specific topic',
          parameters: [
            {
              name: 'topic',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The topic to filter by',
            },
          ],
          responses: {
            '200': {
              description: 'List of sessions for the topic',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        type: 'object',
                        properties: {
                          sessions: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/QuizSession',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Failed to fetch sessions',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/quiz/{sessionId}': {
        get: {
          tags: ['Quiz UI'],
          summary: 'Get quiz by session ID',
          description: 'Retrieve quiz questions and metadata for a specific session. Used by the quiz UI to display questions.',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
              },
              description: 'The quiz session ID',
            },
          ],
          responses: {
            '200': {
              description: 'Quiz data retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        $ref: '#/components/schemas/QuizData',
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Quiz not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Failed to fetch quiz',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/quiz/{sessionId}/answer': {
        post: {
          tags: ['Quiz UI'],
          summary: 'Submit an answer for a question',
          description: 'Submit user answers for a specific question in the quiz. Returns immediate feedback with scoring and correct answers.',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
              },
              description: 'The quiz session ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    questionIndex: {
                      type: 'integer',
                      description: 'Index of the question being answered (0-based)',
                      example: 0,
                    },
                    userAnswers: {
                      type: 'array',
                      items: {
                        type: 'integer',
                      },
                      description: 'Array of selected answer indices',
                      example: [0, 2],
                    },
                  },
                  required: ['questionIndex', 'userAnswers'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Answer submitted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        $ref: '#/components/schemas/AnswerResult',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request - questionIndex or userAnswers missing',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Failed to submit answer',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/quiz/{sessionId}/finish': {
        post: {
          tags: ['Quiz UI'],
          summary: 'Finish the quiz and get final score',
          description: 'Complete the quiz session and calculate final weighted score using geometric progression. Returns detailed score report with breakdown per question.',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
              },
              description: 'The quiz session ID',
            },
          ],
          responses: {
            '200': {
              description: 'Quiz finished successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        $ref: '#/components/schemas/ScoreReport',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Failed to finish quiz',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/metrics': {
        get: {
          tags: ['Monitoring'],
          summary: 'Get LLMOps metrics',
          description: 'Retrieve operational metrics for the last 24 hours including cost, quality, and performance data',
          responses: {
            '200': {
              description: 'Metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      metrics: {
                        type: 'object',
                        properties: {
                          total_quizzes: {
                            type: 'integer',
                            description: 'Total number of quizzes generated in the last 24 hours',
                          },
                          avg_quality_score: {
                            type: 'number',
                            format: 'float',
                            description: 'Average quality evaluation score (0-100)',
                          },
                          pass_rate: {
                            type: 'number',
                            format: 'float',
                            description: 'Percentage of quizzes that passed quality threshold (0-1)',
                          },
                          avg_latency: {
                            type: 'number',
                            format: 'float',
                            description: 'Average generation latency in milliseconds',
                          },
                          total_cost: {
                            type: 'number',
                            format: 'float',
                            description: 'Total cost in USD for the last 24 hours',
                          },
                          cost_per_quiz: {
                            type: 'number',
                            format: 'float',
                            description: 'Average cost per quiz in USD',
                          },
                          by_model: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                model: {
                                  type: 'string',
                                  description: 'LLM model name',
                                },
                                count: {
                                  type: 'integer',
                                  description: 'Number of quizzes generated with this model',
                                },
                                avg_quality: {
                                  type: 'number',
                                  format: 'float',
                                  description: 'Average quality score for this model',
                                },
                              },
                            },
                            description: 'Breakdown of metrics by LLM model',
                          },
                        },
                      },
                      timeRange: {
                        type: 'string',
                        description: 'Time range of the metrics',
                        example: '24h',
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Failed to fetch metrics',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Check the health status of the API server',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
