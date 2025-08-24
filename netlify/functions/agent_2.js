const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getBlobs } = require('@netlify/blobs');
const api_key = process.env.AGENT_2_KEY;
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
    const blobs = getBlobs({ name: 'jobs' });

    // Fetch the current job state from the Blobs store
    const currentJob = await blobs.get(jobId, { type: 'json' });
    
    const prompt = `Generate a complete HTML landing page for: ${userPrompt}. Only plain SINGLE FILED HTML & JAVASCRIPT DESIGN ONLY USING MATERIAL UI, DON'T WRITE ANY CUSTOM CSS,TRY TO MAINTAIN CONSISTENCY IN COLOR,FONT AMD SECURITY no explanations, no delimiters.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const code = response.text();
    
    // Update the job with the HTML code using setJSON
    await blobs.setJSON(jobId, {
      ...currentJob,
      code: code,
      status: 'code_complete'
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Code generation completed" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "agent_2 error: " + (e?.message || e) }),
    };
  }
};
