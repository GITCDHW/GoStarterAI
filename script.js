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
        const response = await fetch('https://gostarterai.netlify.app/.netlify/functions/orchestrator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt }),
        });
        
        // Check HTTP status
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const data = await response.json();
        
        if (!data.pdf) throw new Error("No PDF returned from orchestrator");
        
        // Convert Base64 PDF to Blob
        const binary = atob(data.pdf);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Set download link
        downloadBtn.href = url;
        downloadBtn.download = 'GoStarterAI-Report.pdf';
        downloadPopup.style.display = 'flex';
        
        // Log landing page code for debugging
        console.log("Landing page code:", data.landingPageCode);
        
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