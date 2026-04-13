# Quiz Generator Frontend

Modern, responsive Next.js web application for the AI-powered quiz generation system.

## Features

- **Beautiful UI/UX**: Modern gradient designs with smooth animations and transitions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Feedback**: Loading states, progress indicators, and error handling
- **Interactive Quiz Taking**: Support for both single-choice and multiple-choice questions
- **Results Visualization**: Circular progress indicators and detailed score breakdown
- **Quiz History**: Track and review past quiz sessions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **API Integration**: REST API client with error handling

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Navigate to frontend directory
cd quiz-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3001`

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
quiz-frontend/
├── app/
│   ├── page.tsx              # Home page with URL input
│   ├── quiz/
│   │   └── page.tsx          # Quiz taking interface
│   ├── results/
│   │   └── page.tsx          # Results page with score visualization
│   ├── history/
│   │   └── page.tsx          # Quiz history page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── ui/
│   │   ├── Button.tsx        # Button component
│   │   ├── Card.tsx          # Card components
│   │   ├── Input.tsx         # Input component
│   │   └── LoadingSpinner.tsx # Loading states
│   └── quiz/
│       └── QuestionCard.tsx  # Quiz question component
├── lib/
│   └── api/
│       ├── client.ts         # API client
│       └── types.ts          # TypeScript types
└── README.md
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Pages

### Home Page (`/`)
- URL input for quiz generation
- Example URLs for quick start
- Feature highlights
- Navigation to history

### Quiz Page (`/quiz`)
- Interactive question display
- Progress indicator
- Support for single and multiple choice
- Navigation between questions
- Answer status tracking

### Results Page (`/results`)
- Circular progress score visualization
- Detailed statistics
- Question-by-question review
- Actions to start new quiz or view history

### History Page (`/history`)
- List of all completed quizzes
- Summary statistics (total quizzes, average score, total questions)
- Score color coding
- Quick navigation

## UI Components

### Button
Gradient buttons with variants (primary, secondary, outline) and loading states.

### Card
Flexible card components with header, body, and footer sections.

### Input
Form inputs with labels, validation, and error messages.

### LoadingSpinner
Animated spinner for loading states with configurable sizes.

### QuestionCard
Quiz question component with answer selection and progress tracking.

## API Integration

The frontend connects to the backend API for:

- `POST /api/quiz/generate`: Generate new quiz from URL
- `GET /api/sessions`: Fetch quiz history
- `GET /api/sessions/:id`: Fetch specific session
- `GET /api/sessions/topic/:topic`: Fetch sessions by topic

Error handling includes:
- Network errors
- API errors
- Validation errors
- Timeout handling

## Styling Guidelines

- **Colors**: Blue/Indigo gradient theme
- **Typography**: Geist Sans for UI, Geist Mono for code
- **Spacing**: Consistent 8px grid system
- **Animations**: Smooth transitions (200-300ms)
- **Responsive**: Mobile-first approach

## Development Tips

1. **Hot Reload**: Changes are reflected instantly in development mode
2. **Type Safety**: All components use TypeScript for type checking
3. **API Errors**: Check browser console for detailed error messages
4. **Session Storage**: Quiz data is stored in `sessionStorage` between pages

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables in Production

Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: Your production API URL

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized bundle size
- Code splitting by route
- Image optimization via Next.js
- CSS purging with Tailwind

## Contributing

1. Follow existing code style
2. Use TypeScript for all new files
3. Add proper type annotations
4. Test on multiple screen sizes
5. Ensure accessibility (ARIA labels, keyboard navigation)

## License

MIT
