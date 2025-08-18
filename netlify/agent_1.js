const { GoogleGenerativeAI } = require('@google/generative-ai');
const api_key = process.env.GEMINI_API_KEY;
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
        const { userPrompt } = await JSON.parse(event.body)
        const prompt = `Act as a professional market research analyst. I need a comprehensive market research report for a new business. Please include an executive summary, competitor analysis, target audience demographics, market size, key trends, and a SWOT analysis. The business idea is: ${userPrompt} STRICTLY don't include any other text,code delimiters or anything just the core text in plane paragraph`
        const result = model.generateContent(prompt)
        const response = await result.response;
        const text = response.text();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report: text }),
        };
    } catch (e) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body:"agent_1 error",
        };
    }
    
}