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
