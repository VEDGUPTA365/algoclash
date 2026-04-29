import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('No API key found in .env');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await response.json();
    console.log('Available models:');
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(model.name);
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listModels();
