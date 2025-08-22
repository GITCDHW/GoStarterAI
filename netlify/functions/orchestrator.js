const fetch = require('node-fetch');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

function wrapText(text, font, fontSize, maxWidth) {
    const lines = [];
    let currentLine = '';
    const words = text.split(' ');
    
    for (const word of words) {
        const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine); // avoid empty push
    return lines;
}

exports.handler = async (event, context) => {
    // Handle preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*', // allow all headers
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
        const baseUrl = process.env.URL || "";
        
        // 1. Call agents in parallel
        const agent1Promise = fetch(`${baseUrl}/.netlify/functions/agent_1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt }),
        });
        
        const agent2Promise = fetch(`${baseUrl}/.netlify/functions/agent_2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt }),
        });
        
        const [agent1Response, agent2Response] = await Promise.all([agent1Promise, agent2Promise]);
        
        // 2. Validate responses
        if (!agent1Response.ok) throw new Error(`agent_1 error: ${agent1Response.statusText}`);
        if (!agent2Response.ok) throw new Error(`agent_2 error: ${agent2Response.statusText}`);
        
        const { report: reportText } = await agent1Response.json();
        const { code } = await agent2Response.json();
        
        // 3. Build PDF
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const margin = 50;
        const fontSize = 12;
        
        const paragraphs = reportText.split('\n');
        let page = pdfDoc.addPage();
        let yPosition = page.getSize().height - margin;
        
        for (const paragraph of paragraphs) {
            const maxWidth = page.getWidth() - (2 * margin);
            const wrappedLines = wrapText(paragraph, font, fontSize, maxWidth);
            
            for (const line of wrappedLines) {
                if (yPosition < margin) {
                    page = pdfDoc.addPage();
                    yPosition = page.getSize().height - margin;
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
            yPosition -= 15; // extra gap between paragraphs
        }
        
        const pdfBytes = await pdfDoc.save();
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        
        // 4. Return response
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdf: base64Pdf,
                landingPageCode: code
            }),
        };
        
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: "Orchestrator error: " + e.message }),
        };
    }
};