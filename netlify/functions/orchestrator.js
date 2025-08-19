const fetch = require('node-fetch');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { buffer } = require("buffer");

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
    lines.push(currentLine);
    return lines;
}


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
        const { userPrompt } = JSON.parse(event.body);

        // Call agent_1 via HTTP request
        const agent1Url = `${process.env.URL}/.netlify/functions/agent_1`;
        const agent1Response = await fetch(agent1Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt }),
        });

        if (!agent1Response.ok) {
            throw new Error(`agent_1 returned an error: ${agent1Response.statusText}`);
        }

        const { report: reportText } = await agent1Response.json();

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // PDF rendering logic
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
            body: JSON.stringify({ pdf: base64Pdf, report: reportText }),
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

