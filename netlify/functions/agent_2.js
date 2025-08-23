const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.AGENT_1_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handler = async (event) => {
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
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { userPrompt } = JSON.parse(event.body);
    const prompt = `Generate a complete HTML landing page for: ${userPrompt}. Only plain HTML, no explanations, no delimiters.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const kv = context.kv
    await kv.set(jobId, JSON.stringify({
  ...currentJob,
  report: report,
  status: 'code_completed'
}));
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message:"code generation completed" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "agent_2 error: " + (e?.message || e) }),
    };
  }
};