const { v4: uuidv4 } = require('uuid');

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
    const { userPrompt } = JSON.parse(event.body);
    const kv = context.kv;
    const jobId = uuidv4();
    
    // Set initial job status to 'pending'
    await kv.set(jobId, JSON.stringify({ status: 'pending' }));

    const baseUrl = "https://gostarterai.netlify.app/.netlify/functions";
    
    // Asynchronously call agent_1 and agent_2 without awaiting
    fetch(`${baseUrl}/agent_1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, jobId }),
    }).catch(err => console.error("Agent 1 failed:", err));
    
    fetch(`${baseUrl}/agent_2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, jobId }),
    }).catch(err => console.error("Agent 2 failed:", err));
    
    return {
      statusCode: 202, // 202 Accepted, indicating the request is being processed
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ jobId }),
    };
  } catch (e) {
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: e.toString() 
    };
  }
};
