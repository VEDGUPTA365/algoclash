import { GoogleGenerativeAI } from '@google/generative-ai';

export const analyzeCode = async (req, res) => {
  const { title, description, code, language } = req.body;

  if (!title || !description || !code || !language) {
    return res.status(400).json({ message: 'Missing required fields for AI analysis.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert programming tutor and AI assistant for the AlgoClash platform.
A user is trying to solve a problem and needs help.

Problem Title: ${title}
Problem Description: 
${description}

User's current code (Language: ${language}):
\`\`\`${language}
${code}
\`\`\`

Task:
1. Analyze their code and explain any syntax errors, logical flaws, or edge cases they missed.
2. Provide a full, correct solution in ${language}.
3. Explain why the solution works clearly and concisely.

Format your response in Markdown. Use headings for "Analysis" and "Solution".
`;

    let text = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      text = (await result.response).text();
    } catch (primaryErr) {
      if (primaryErr.message && (primaryErr.message.includes('503') || primaryErr.message.includes('429'))) {
        console.warn('Gemini primary model failed (503/429). Falling back to Gemini Flash Latest...');
        const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await fallbackModel.generateContent(prompt);
        text = (await result.response).text();
      } else {
        throw primaryErr;
      }
    }

    return res.status(200).json({ analysis: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ message: 'Failed to analyze code with AI. ' + error.message });
  }
};
