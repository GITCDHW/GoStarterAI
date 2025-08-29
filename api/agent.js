import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with our API key from Vercel's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

// Define a function to generate all content with one call
async function generateAllContent(prompt) {
    // Select the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // The comprehensive, restrictive prompt
    const masterPrompt = `
    You are a professional business asset generator. Your goal is to provide a complete set of assets for a user's business idea. The entire response must be a single, valid JSON object. Do not include any other text or delimiters outside of the JSON.

    For the given user request: ${prompt}, generate the following:
    1.a compelling and professional business name

    The final output must be a single JSON object with the following keys:
    {
        "BusinessName": "[The generated business name]"
    }
    
    Make educated guesses and reasonable assumptions if the user's information is not detailed enough.
    `;

    try {
        const result = await model.generateContent(masterPrompt);
        const responseText = await result.response.text();

        // Parse the JSON response
        const data = JSON.parse(responseText.trim());
        
        return data;

    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error('Failed to generate content from Gemini API.');
    }
}

// Define the API handler
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
    const combinedData = await generateAllContent(prompt);
    // Send the response back to the client as a single JSON object
    res.status(200).json({data:combinedData});
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
}
