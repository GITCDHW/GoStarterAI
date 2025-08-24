const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.AGENT_1_KEY;
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
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { userPrompt, jobId } = JSON.parse(event.body);
    // **FIXED:** Using dynamic import for getStore
    const { getStore } = await import('@netlify/blobs');
    const blobs = getStore('jobs');
    
    const currentJob = await blobs.get(jobId, { type: 'json' });

    const prompt = `Act as a professional market research analyst. Generate a brief market analysis report, including competitor analysis,and a plan to execute the business, given that the user has got a website,a logo(if its a new Business) from our side: ${userPrompt},If missing, respond with "DATA NOT FOUND".RESPOND Only plain text,NO ADDITIONAL TEXT,CODE DELIMITERS.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const report = response.text();
    
    await blobs.setJSON(jobId, {
      ...currentJob,
      report: report,
      status: 'report_complete'
    });

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
