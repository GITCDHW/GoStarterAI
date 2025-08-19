const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_ORCHESTRATOR_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.0-flash-preview-image-generation" });