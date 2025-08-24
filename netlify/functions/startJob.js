const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => { // Added 'context' here
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
    
    // **FIXED:** Using dynamic import for getBlobs
    const { getBlobs } = await import('@netlify/blobs');
    
    // **FIXED:** Using getBlobs with a configuration object
    const blobs = getBlobs({ name: 'jobs' });
    const jobId = uuidv4();
    await blobs.setJSON(jobId, { status: 'pending' });
    
    const baseUrl = "https://gostarterai.netlify.app/.netlify/functions";
    
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
      statusCode: 202,
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
