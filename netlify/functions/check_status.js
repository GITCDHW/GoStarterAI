import { neon } from '@netlify/neon';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
      },
      body: "",
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
    
    const sql = neon(process.env.NETLIFY_DB_URL);

    // Query the database for the specific job
    const jobData = await sql`
      SELECT report, code, status
      FROM jobs
      WHERE job_id = ${jobId};
    `;

    if (!jobData || jobData.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ isComplete: false, status: 'not_found' }),
      };
    }

    const job = jobData[0];
    const isComplete = job.report && job.code;

    if (isComplete) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          isComplete: true,
          report: job.report,
          code: job.code
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          isComplete: false,
          status: job.status
        }),
      };
    }
  } catch (e) {
    console.error("check_status error:", e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "check_status error: " + (e?.message || e) }),
    };
  }
};
