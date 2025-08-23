const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.AGENT_1_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handler = async (event, context) => {
  // Handle preflight CORS requests
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
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { userPrompt, jobId } = JSON.parse(event.body);
    const kv = context.kv;
    
    // Fetch the current job state from the KV store
    const currentJobJson = await kv.get(jobId);
    const currentJob = currentJobJson ? JSON.parse(currentJobJson) : {};

    const prompt = `Act as a professional market research analyst. Generate a brief market analysis report for: ${userPrompt}, in about 500 words. If missing, respond with "DATA NOT FOUND". Only plain text.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const report = response.text();
    
    // Update the job with the report data
    await kv.set(jobId, JSON.stringify({
      ...currentJob,
      report: report,
      status: 'report_complete'
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Report successfully generated" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "agent_1 error: " + (e?.message || e) }),
    };
  }
};
