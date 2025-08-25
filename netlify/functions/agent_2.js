import { GoogleGenerativeAI } from '@google/generative-ai';
import { neon } from '@netlify/neon';

const api_key = process.env.AGENT_2_KEY;
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

    const prompt = `Generate a complete HTML landing page...`; // Your original prompt
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const code = response.text();
    
    // Update the database row with the generated code
    await sql`
      UPDATE jobs
      SET code = ${code}, status = 'code_complete'
      WHERE job_id = ${jobId};
    `;
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "Code generation completed" }),
    };
  } catch (e) {
    console.error("agent_2 error:", e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: "agent_2 error: " + (e?.message || e) }),
    };
  }
};
