import dotenv from 'dotenv';

dotenv.config();

// Validate critical environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-in-production')) {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/fashion_agent_dev',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '24h' : '7d'),
  } as {
    secret: string;
    expiresIn: string;
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'fashion-agent',
  },
  
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterUrl: process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.AI_MODEL || 'openai/gpt-4.1-nano',
    // Add other AI service configs as needed
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};
