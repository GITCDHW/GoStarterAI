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
        const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userPrompt)
    };
    const respone = await fetch("https://go-starter-ai.vercel.app/api/agent")
    const data = await response.text()
    return data
}

// Form submit event
promptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) {
        alert("Please enter a business idea.");
        return;
    }
    const code = makeApiCall(prompt);
    console.log(code)
});
