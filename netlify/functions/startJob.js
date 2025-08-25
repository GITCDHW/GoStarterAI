import { neon } from '@netlify/neon';

const AGENT_1_URL = 'https://gostarterai.netlify.app/.netlify/functions/agent_1';
const AGENT_2_URL = 'https://gostarterai.netlify.app/.netlify/functions/agent_2';

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
    if (!userPrompt) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'userPrompt is required' }),
      };
    }

    const sql = neon(process.env.NETLIFY_DB_URL);

    // Insert a new job and return the ID. Postgres `RETURNING` is key here.
    const result = await sql`
      INSERT INTO jobs (user_prompt, status, report, code)
      VALUES (${userPrompt}, 'started', NULL, NULL)
      RETURNING job_id;
    `;

    const jobId = result[0].job_id;

    // Asynchronously call Agent 1 and Agent 2
    fetch(AGENT_1_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, jobId }),
    }).catch(console.error);

    fetch(AGENT_2_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, jobId }),
    }).catch(console.error);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ jobId }),
    };

  } catch (e) {
    console.error("startJob error:", e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "startJob error: " + (e?.message || e) }),
    };
  }
};
