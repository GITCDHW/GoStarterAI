const agent_1 = require("./agent_1")
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const {buffer} = require("buffer")
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
      const responseBody = agent1Response.body
      const parsedBody = JSON.parse(responseBody)
      const reportText = parsedBody.report
      
      const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const margin = 50;
        const fontSize = 12;
        const lines = reportText.split('\n');
        let yPosition = page.getSize().height - margin;

        for (const line of lines) {
            if (yPosition < margin) {
                const newPage = pdfDoc.addPage();
                yPosition = newPage.getSize().height - margin;
            }
            page.drawText(line, {
                x: margin,
                y: yPosition,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
            });
            yPosition -= 15;
        }

        const pdfBytes = await pdfDoc.save();
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        
      return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({pdf:base64Pdf}),
        };
    } catch (e) {
      throw e
    }
}