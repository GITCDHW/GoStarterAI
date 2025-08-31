import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with our API key from Vercel's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
//code generation 
async function generateCode(prompt,name) {
      // Select the model
    const masterPrompt = `you are a professional frontend developer,your goal is to provide a clean,modern efficient and well formatted html code for a responsive landing page,for the given users request: ${prompt},with the business name:${name},make educated guesses,if user doesnt provides enough information,and strictly use material UI framework,dont write any custom css dont add any other text or code delimiters,just plain text,MAKE SURE THE ENTIRE CODE WORKS`
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(masterPrompt);
    const response = await result.response;
    const text = response.text();
    return text
}
//market report generation
async function generateMarketReport(prompt) {
      // Select the model
    const masterPrompt = `you are a professional business analyst in the GoStarterAI Team,which takes user input to generate business assets for them,assume our developers has provided the user a cool website for their business idea,your task is to check if the business is valid,if not try to assume the closest possible business idea and then generate a brief market analysis containing: a market report and swot analysis in about 500-600 words strictly,provided the user idea: ${prompt},make the text Professional,easy to read and accurate,DONT INCLUDE ANY OTHER TEXT,OR CODE DELIMITERS`
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
  const { prompt } = req.body.prompt;
  const { name } = req.body.businessName;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Send the response back to the client
    // Await all promises in parallel
let [websiteCode, marketReport] = await Promise.all([
  generateCode(prompt),
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
