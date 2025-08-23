// DOM elements
const promptForm = document.getElementById('prompt_form');
const downloadPopup = document.getElementById('download-popup');
const downloadBtn = document.getElementById('download-btn');
const closeBtn = document.getElementById('close-btn');

// Close popup
closeBtn.onclick = () => {
    downloadPopup.style.display = "none";
};

// Polling function to check job status
async function pollForResults(jobId) {
    try {
        const checkResp = await fetch(`https://gostarterai.netlify.app/.netlify/functions/check_status?jobId=${jobId}`);
        const data = await checkResp.json();

        if (data.isComplete) {
            // Job is complete, generate PDF and show popup
            const { report, code } = data;

            // Ensure jsPDF library is loaded
            if (typeof window.jspdf === 'undefined') {
                throw new Error("jsPDF library not found. Please include it in your HTML.");
            }
            
            // Generate PDF on the frontend using jsPDF
            const doc = new window.jspdf.jsPDF();
            const maxWidth = doc.internal.pageSize.getWidth() - 20;
            const splitText = doc.splitTextToSize(report, maxWidth);
            doc.text(splitText, 10, 10);
            
            // Create a blob and URL for the generated PDF
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            
            // Set download link and show the popup
            downloadBtn.href = url;
            downloadBtn.download = 'GoStarterAI-Report.pdf';
            downloadPopup.style.display = 'flex';
            
            // Log landing page code for debugging
            console.log("Landing page code:", code);
        } else {
            // Job is not yet complete, poll again in 3 seconds
            setTimeout(() => pollForResults(jobId), 3000);
        }
    } catch (err) {
        console.error("Polling error:", err?.message || err);
        alert("Something went wrong during polling. Check console for details.");
    }
}

// API call function
async function makeApiCall(userPrompt) {
    try {
        // Step 1: Start the long-running job and get a job ID
        const startResp = await fetch('https://gostarterai.netlify.app/.netlify/functions/startJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt }),
        });

        const { jobId } = await startResp.json();
        if (!jobId) throw new Error("Could not start job. No jobId returned.");

        // Step 2: Begin polling for the job results
        alert("Your request is being processed. It may take a minute or two.");
        pollForResults(jobId);

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
