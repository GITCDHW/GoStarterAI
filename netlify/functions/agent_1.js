import { GoogleGenerativeAI } from '@google/generative-ai';
import { neon } from '@netlify/neon';

const api_key = process.env.AGENT_1_KEY;
const genAi = new GoogleGenerativeAI(api_key);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { userPrompt, jobId } = JSON.parse(event.body);
    const sql = neon(process.env.NETLIFY_DB_URL);

    const prompt = `Act as a professional market research analyst...`; // Your original prompt
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const report = response.text();
    
    // Update the database row with the generated report
    await sql`
      UPDATE jobs
      SET report = ${report}, status = 'report_complete'
      WHERE job_id = ${jobId};
    `;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Report successfully generated" }),
    };
  } catch (e) {
    console.error("agent_1 error:", e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "agent_1 error: " + (e?.message || e) }),
    };
  }
};
