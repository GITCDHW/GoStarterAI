import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with our API key from Vercel's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
//code generation 
async function generateCode(prompt,name) {
    const masterPrompt = `You are an expert frontend developer specializing in clean, modern, and highly-efficient web design. Your goal is to create a fully responsive, mobile-friendly landing page in a single file. Use **plain HTML, CSS, and Javascript** and strictly adhere to the **Tailwind CSS** framework with a clean, utility-first approach. Do not write any custom CSS outside of the Tailwind classes.

**IMPORTANT CONSTRAINT: Do not use any irrelevant images or visual assets,if you have to use then ONLY USE IMAGES THAT ARE RELEVANT TO THE TOPIC.Use color, typography, and spacing to create a visually appealing design.**

The landing page must have the following sections, tailored to the business and prompt:

1.  **A prominent hero section** with a clear headline, a concise subheading, and a single, strong call-to-action (CTA) button.
2.  **A features section** that highlights the key benefits of the business. Use a clean, grid-based layout for the feature cards.
3.  **A call-to-action (CTA) section** with a compelling message to encourage user engagement.
4.  **A footer** containing essential links (e.g., Contact, About) and copyright information.

For each new request, you must make a unique design choice.

Here is the user's request:
- **Prompt**: ${prompt}
- **Business Name**: ${name}

Make educated guesses and create relevant, well-structured content based on the user's prompt. Ensure the final code is well-formatted, commented, and fully functional.

DO NOT USE ANY ADDITIONAL TEXT,CODE DELIMITERS OR ANYTHING OR ANY OTHER TEXT,JUST PLAIN CODE
`
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(masterPrompt);
    const response = await result.response;
    const text = response.text();
    return text
}
//market report generation
async function generateMarketReport(prompt) {
      // Select the model
    const masterPrompt = `You are a professional business analyst for the GoStarterAI Team. Your primary objective is to analyze a user's business idea and provide a brief market analysis.

Your process is as follows:
1.  **Business Validation**: Assess the user's provided business idea. If the idea is unclear or invalid, make a professional and educated assumption to identify the closest viable business concept.
2.  **Market Analysis Generation**: Based on the validated or assumed business idea, generate a brief market analysis report. This report must be approximately **500-600 words** in length.

The market analysis must contain two distinct sections:
* **Market Report**: Provide a concise overview of the current market landscape for the business idea. This should include an analysis of market trends, target audience, and key competitors.
* **SWOT Analysis**: Present a structured SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) specifically tailored to the business idea.

**Critical Instructions:**
-   Ensure the language is professional, easy to read, and accurate.
-   The entire response must be a single block of text.
-   **Do not** include any pre-text, post-text, code delimiters, or any other conversational elements.
-   The word count must strictly fall within the 500-600 word range.
-   If no business idea is provided, state that the business idea is unclear and provide a generic analysis for a hypothetical "AI-powered business asset generator."

**User's Provided Idea:**
-   **Prompt**: ${prompt}

DO NOT USE ANY ADDITIONAL TEXT,CODE DELIMITERS OR ANYTHING OR ANY OTHER TEXT,JUST PASTE DIRECT MARKET REPORT CONTENT
`
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(masterPrompt);
    const response = await result.response;
    const text = response.text();
    return text
}
// Define a function handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the prompt from the request body
  const { prompt,businessName} = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Send the response back to the client
    // Await all promises in parallel
let [websiteCode, marketReport] = await Promise.all([
  generateCode(prompt,businessName),
  generateMarketReport(prompt)
]);
websiteCode = websiteCode.replace('```html\n', '').replace('\n```', '');

// Send the response back to the client as a single JSON object
res.status(200).json({ 
  websiteCode: websiteCode, 
  marketReport: marketReport 
});
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ message: 'Failed to generate content' });
  }
}
