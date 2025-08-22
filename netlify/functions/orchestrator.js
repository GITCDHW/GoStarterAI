const fetch = require('node-fetch');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Helper to wrap text in PDF
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
    if (currentLine) lines.push(currentLine);
    return lines;
}

exports.handler = async (event) => {
    // Handle preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
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
        const baseUrl = "https://gostarterai.netlify.app/.netlify/functions";
        
        // Call agents in parallel
        const [agent1Resp, agent2Resp] = await Promise.all([
            fetch(`${baseUrl}/agent_1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt }),
            }),
            fetch(`${baseUrl}/agent_2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt }),
            })
        ]);
        
        if (!agent1Resp.ok) throw new Error(`agent_1 failed: ${await agent1Resp.text()}`);
        if (!agent2Resp.ok) throw new Error(`agent_2 failed: ${await agent2Resp.text()}`);
        
        const { report } = await agent1Resp.json();
        const { code } = await agent2Resp.json();
        
        // Build PDF
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const margin = 50;
        const fontSize = 12;
        const paragraphs = report.split('\n');
        
        let page = pdfDoc.addPage();
        let y = page.getHeight() - margin;
        
        for (const para of paragraphs) {
            const maxWidth = page.getWidth() - 2 * margin;
            const lines = wrapText(para, font, fontSize, maxWidth);
            
            for (const line of lines) {
                if (y < margin) {
                    page = pdfDoc.addPage();
                    y = page.getHeight() - margin;
                }
                page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
                y -= 15;
            }
            y -= 15; // extra gap between paragraphs
        }
        
        const pdfBytes = await pdfDoc.save();
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdf: base64Pdf,
                landingPageCode: code,
            }),
        };
        
    } catch (e) {
        console.error("Orchestrator error:", e?.message || e);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: "Orchestrator error: " + (e?.message || e) }),
        };
    }
};