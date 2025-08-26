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
// API call function
async function makeApiCall(userPrompt) {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: userPrompt }) // Correctly sends the prompt in a JSON object
    };

    const response = await fetch("https://go-starter-ai.vercel.app/api/agent", requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Use .json() to parse the JSON response
    return data.code; // Return the code property from the response
  } catch (error) {
    console.error("API call failed:", error);
    alert("Something went wrong. Check the console for details.");
    return null;
  }
}


// Form submit event
promptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.getElementById("prompt").value.trim();
    if (!prompt) {
        alert("Please enter a business idea.");
        return;
    }
    const code = await makeApiCall(prompt);
    console.log(code)
});
