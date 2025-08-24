exports.handler = async (event) => {
  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
      body: ""
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { jobId } = event.queryStringParameters;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'jobId is required' }),
      };
    }
    const { getStore } = await import('@netlify/blobs');
    const blobs = getStore('jobs', {
      siteId: "cb94ca2e-e8cc-4831-9983-8e2e2eee41a0",
      token: process.env.NETLIFY_TOKEN
      
    });
    const jobData = await blobs.get(jobId, { type: 'json' });
    
    if (!jobData) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ isComplete: false, status: 'not_found' }),
      };
    }
    
    // Check if both the report and code have been generated
    const isComplete = jobData.report && jobData.code;
    
    if (isComplete) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          isComplete: true,
          report: jobData.report,
          code: jobData.code
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          isComplete: false,
          status: jobData.status
        }),
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "check_status error: " + (e?.message || e) }),
    };
  }
};