// DOM elements
const promptForm = document.getElementById('prompt_form');
const downloadPopup = document.getElementById('download-popup');
const downloadBtn = document.getElementById('download-btn');
const closeBtn = document.getElementById('close-btn');

// Close popup
closeBtn.onclick = () => {
    downloadPopup.style.display = "none";
};

// API call function
async function makeApiCall(userPrompt) {
    try {
        // Fetch data from both agents in parallel
        const [agent1Resp, agent2Resp] = await Promise.all([
            fetch('https://gostarterai.netlify.app/.netlify/functions/agent_1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt }),
            }),
            fetch('https://gostarterai.netlify.app/.netlify/functions/agent_2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt }),
            })
        ]);

        // Check HTTP status for each response
        if (!agent1Resp.ok) {
            const text = await agent1Resp.text();
            throw new Error(`agent_1 failed: HTTP ${agent1Resp.status}: ${text}`);
        }
        if (!agent2Resp.ok) {
            const text = await agent2Resp.text();
            throw new Error(`agent_2 failed: HTTP ${agent2Resp.status}: ${text}`);
        }

        const agent1Data = await agent1Resp.json();
        const agent2Data = await agent2Resp.json();
        
        const report = agent1Data.report;
        const landingPageCode = agent2Data.code;

        // Ensure jsPDF library is loaded
        if (typeof window.jspdf === 'undefined') {
            throw new Error("jsPDF library not found. Please include it in your HTML.");
        }
        
        // Generate PDF on the frontend using jsPDF
        const doc = new window.jspdf.jsPDF();
        
        // Split the report text into lines that fit the page width
        const maxWidth = doc.internal.pageSize.getWidth() - 20; // 10mm margin on each side
        const splitText = doc.splitTextToSize(report, maxWidth);
        
        // Add the split text to the document
        doc.text(splitText, 10, 10);
        
        // Create a blob and URL for the generated PDF
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        
        // Set download link
        downloadBtn.href = url;
        downloadBtn.download = 'GoStarterAI-Report.pdf';
        downloadPopup.style.display = 'flex';
        
        // Log landing page code for debugging
        console.log("Landing page code:", landingPageCode);
        
    } catch (err) {
        console.error("API call error:", err?.message || err);
        alert("Something went wrong. Check console for details.");
    }
}

// Form submit event
promptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) {
        alert("Please enter a business idea.");
        return;
    }
    makeApiCall(prompt);
});
