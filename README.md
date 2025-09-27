# Fashion Agent - AI Style Insights

A modern web application that provides AI-driven insights on your dressing choices. Users can upload outfit photos and receive structured feedback on style, fit, color harmony, and occasion suitability.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Image Storage**: Cloudinary
- **Deployment**: Railway

## 🚀 Features

- **AI-Powered Analysis**: Upload outfit photos for instant AI feedback
- **Style Insights**: Get feedback on fit, color harmony, and occasion suitability
- **History Tracking**: View your past outfit analyses (up to 5 reviews)
- **Profile Management**: Personalized recommendations based on your profile
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## 📁 Project Structure

```
fashion-agent/
├── frontend/          # Next.js frontend application
├── backend/           # Express backend API
├── README.md         # This file
├── package.json      # Root package.json for dev scripts
└── railway.json      # Railway deployment config
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+
- PostgreSQL database
- Cloudinary account (for image storage)

### 1. Clone and Install

```bash
git clone <repository-url>
cd fashion-agent

# Install root dependencies (for development scripts)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Configuration

#### Backend Environment (backend/.env)

Create `backend/.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fashion_agent_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_FOLDER="fashion-agent"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Server
PORT=5000
NODE_ENV="development"
```

#### Frontend Environment (frontend/.env.local)

Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Optional: Seed database
npm run db:seed
```

### 4. Run Development Servers

From the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately:
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🚂 Railway Deployment

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Add PostgreSQL database service

### 2. Deploy Backend

1. Create a new service from GitHub repo
2. Set root directory to `/backend`
3. Add environment variables:

```env
DATABASE_URL=${{ Postgres.DATABASE_URL }}
JWT_SECRET="your-production-jwt-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
OPENAI_API_KEY="your-openai-api-key"
PORT=5000
NODE_ENV="production"
```

4. Deploy will automatically run migrations

### 3. Deploy Frontend

1. Create another service from the same GitHub repo
2. Set root directory to `/frontend`
3. Add environment variables:

```env
NEXT_PUBLIC_API_URL="https://your-backend-url.railway.app"
```

### 4. Custom Domain (Optional)

Configure custom domains for both services in Railway dashboard.

## 🔧 API Documentation

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Reviews

- `POST /api/reviews` - Upload outfit image for analysis
- `GET /api/reviews` - Get user's review history
- `POST /api/reviews/:id/compare` - Compare with previous reviews
- `POST /api/reviews/:id/accept` - Accept/reject feedback

## 🎨 UI Components

The frontend includes:

- **LoginPage**: Authentication with toggle between login/register
- **Dashboard**: Main app interface with bottom navigation
- **UploadSection**: Drag-and-drop image upload with preview
- **OutfitAnalysis**: Detailed AI feedback display
- **ReviewHistory**: Past outfit analyses
- **ProfileSection**: User profile management

## 🤖 AI Integration

The app includes a placeholder AI service structure for:
- **Outfit Analysis**: Extract style features from images
- **Reasoning**: Generate textual insights and comparisons

To implement real AI:
1. Replace mock functions in `backend/src/services/aiService.ts`
2. Integrate with OpenAI Vision API or custom models
3. Add proper error handling and rate limiting

## 🗄️ Database Schema

**Users Table:**
- Authentication and basic user info

**Profiles Table:**
- User physical characteristics for personalization

**Reviews Table:**
- Outfit analysis results and images
- Automatic cleanup (keeps last 5 per user)

## 🔐 Security Features

- JWT authentication with secure token handling
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Secure image upload to Cloudinary

## 🚀 Performance

- Image optimization with Cloudinary transformations
- Lazy loading and responsive images
- Efficient database queries with Prisma
- Mobile-first responsive design
- Loading states for better UX

## 📱 Mobile Experience

- Progressive Web App (PWA) ready
- Touch-friendly interface
- Mobile-optimized image upload
- Responsive design for all screen sizes

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

## 📈 Monitoring

- Health check endpoints for both services
- Error logging and monitoring
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email [your-email] or create an issue in the GitHub repository.
