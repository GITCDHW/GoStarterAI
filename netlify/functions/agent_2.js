const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_ORCHESTRATOR_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handler = async (event, context) => {
      if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: ""
        };
    }
  try {
    const { prompt } = JSON.parse(event.body);
    const masterPrompt = `you are a master frontend developer,your goal is to use the following user prompt: ${prompt},which is their business idea,and your goal is to generate a single html landing page for the proposed idea,if it contains something irrelevant, return a html page with one header: irrelevant business idea,if the idea is not comprehensive enough try to make educated guesses for the missing features
    strictly dont include any other text or code delimiters,just plain text code`
    
    const result = await model.generateContent(masterPrompt)
    const response = await result.response;
    const text = response.text();
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          code:text
        })
      };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "An internal server error occurred." })
    };
  }
};''