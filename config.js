import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['OPENAI_API_KEY'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const PORT = Number(process.env.PORT) || 4000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SCRAPE_TIMEOUT = Number(process.env.SCRAPE_TIMEOUT) || 30000;
export const MAX_POSTS = Number(process.env.MAX_POSTS) || 20;
export const HEADLESS_MODE = process.env.HEADLESS_MODE || 'true';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
