import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with our API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

/**
 * Generates a single, compelling business name based on a user prompt.
 * @param {string} prompt The business idea from the user.
 * @returns {Promise<string>} A promise that resolves to the generated business name.
 */
async function generateName(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const masterPrompt = `
    You are a professional business consultant. Your only task is to generate one compelling, one-line business name for the user's business idea. Do not include any other text, explanation, or punctuation. Just return the name.

    User's Business Idea: ${prompt}
    `;

    try {
        const result = await model.generateContent(masterPrompt);
        const response = await result.response;
        const text = response.text();
        return text.trim();
    } catch (error) {
        console.error("Error generating business name:", error);
        // Re-throw the error to be handled by the main API handler
        throw new Error('Failed to generate business name.');
    }
}

/**
 * Vercel API handler to process the request and return a business name.
 * @param {import('next').NextApiRequest} req The incoming request.
 * @param {import('next').NextApiResponse} res The outgoing response.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        const businessName = await generateName(prompt);
        res.status(200).json({ name: businessName });
    } catch (error) {
        console.error('Error in API handler:', error);
        res.status(500).json({ message: 'Failed to process request' });
    }
}
