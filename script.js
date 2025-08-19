const promptForm = document.getElementById('prompt_form');
const downloadPopup = document.getElementById('download-popup');
const downloadBtn = document.getElementById('download-btn');
const closeBtn = document.getElementById('close-btn');
closeBtn.onclick = ()=>{
    downloadPopup.style.display="none"
}
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
        const bs64Data = data.pdf || data.report
        console.log(bs64Data)
    } catch (error) {
        console.error('Error:', error);
    }
}


const form = document.getElementById("prompt_form")
form.addEventListener("submit", (e) => {
    const prompt = document.getElementById("prompt").value
    e.preventDefault()
    makeApiCall(prompt)
})