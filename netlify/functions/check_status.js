exports.handler = async (event) => {
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
    const { getBlobs } = await import('@netlify/blobs');
    const blobs = getBlobs({ name: 'jobs' });
    
    const jobData = await blobs.get(jobId, { type: 'json' });
    
    if (!jobData) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ isComplete: false, status: 'not_found' }),
      };
    }
    
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
