const agent_1 = require("./agent_1")

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
      const {userPrompt} = JSON.parse(event.body)
      const agent1Response = await agent_1({
        body:JSON.stringify({userPrompt}),
        httpMethod:'POST'
      })
      const responseBody = JSON.parse({agent1Response})
      return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseBody.report),
        };
    } catch (e) {
      throw e
    }
}