async function makeApiCall(userPrompt) {
    try {
        const response = await fetch('gostarterai.netlify.app/.netlify/functions/orchestrator', {
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
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}


const form = document.getElementById("prompt_form")
form.addEventListener("submit",()=>{
  
})