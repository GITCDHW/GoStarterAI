async function makeApiCall(userPrompt) {
    try {
        const response = await fetch('https://gostarterai.netlify.app/.netlify/functions/orchestrator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userPrompt }),
        });
        
        if (!response.ok) {
            // If the server responded with an error status
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const bs64Data = data.pdf
        if (bs64Data) {
            // 1. Decode the Base64 string to a binary string
            const binaryString = atob(base64Pdf);
            
            // 2. Convert the binary string to a Uint8Array
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // 3. Create a Blob from the byte array
            const blob = new Blob([bytes], { type: 'application/pdf' });
            
            // 4. Create a URL for the Blob
            const blobUrl = URL.createObjectURL(blob);
            
            // 5. Set the download link and filename
            downloadBtn.href = blobUrl;
            downloadBtn.download = 'GoStarterAI-Report.pdf';
            
            // Show the popup
            downloadPopup.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


const form = document.getElementById("prompt_form")
form.addEventListener("submit", (e) => {
    const prompt = document.getElementById("prompt")
    e.preventDefault()
    makeApiCall(prompt)
})