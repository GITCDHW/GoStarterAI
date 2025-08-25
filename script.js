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
