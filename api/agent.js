import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key from Vercel's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define a function handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the prompt from the request body
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Select the model
    const masterPrompt = `yoy are a professional frontend developer,your goal is to provide a clean,modern efficient landing page,for the given users request: ${prompt},make educated guesses,if user doesnt provides enough information,dont add any other text or code delimiters,just plain text`
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the response back to the client
    res.status(200).json({code:text});
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ message: 'Failed to generate content' });
  }
}
