// API call function
async function makeApiCall(userPrompt, businessName) {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: userPrompt,
        businessName:businessName
      })
    };
    
    const response = await fetch("https://go-starter-ai.vercel.app/api/agent", requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    alert("Something went wrong. Check the console for details.");
    return null;
  }
}

// New API call function for name generation
async function makeNameApiCall(userPrompt) {
    try {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: userPrompt })
        };
        const response = await fetch("https://go-starter-ai.vercel.app/api/nameGen", requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Name API call failed:", error);
        return null;
    }
}
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("User is signed in:", user.uid);
    
    const promptForm = document.getElementById("prompt_form");
promptForm.style.display="block"
    promptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      document.getElementById("loading-overlay").style.display="flex"
      const prompt = document.getElementById("prompt").value.trim();
      const userProvidedName = document.getElementById("name").value.trim();
      
      if (!prompt) {
        alert("Please enter a business idea.");
        return;
      }

      let nameData;

      // First, get the business name. This call runs first.
      if (userProvidedName) {
        nameData = { name: userProvidedName };
      } else {
        nameData = await makeNameApiCall(prompt);
      }
        
      // If the name call succeeded, proceed to the main API call.
      if (nameData) {
        const mainApiData = await makeApiCall(prompt,nameData.name);
        
        if (mainApiData) {
          const finalData = {
            businessName: nameData.name,
            websiteCode: mainApiData.websiteCode,
            marketReport: mainApiData.marketReport,
            isPaid:false,
            isHosted:false
          }
          const newBusinessRef = userBusinessesRef.push(finalData);
          const newBusinessKey=newBusinessRef.key;
          
          document.getElementById("prompt_container").style.display="none";
          document.getElementById("loading-overlay").style.display="none"
          document.getElementById("success-message").style.display="block"
          document.getElementById("view-business-button").onclick=()=>{
            window.location.href=`dashboard.html?id=${newBusinessKey}`
          }
        } else {
          console.error("Main API call failed or returned null data.");
        }
      } else {
        console.error("Name API call failed or returned null data.");
      }
    });

    const userRef = db.ref('users/' + user.uid);
    const userBusinessesRef = db.ref(`users/${user.uid}/businesses`)
    
    userRef.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: new Date().toISOString()
          }).then(() => {
            console.log("New user profile created successfully.");
          });
        }
      });
  } else {
    // User is not signed in.
    document.querySelector(".main-container").style.display = "none"
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    
    const uiConfig = {
      signInSuccessUrl: window.location.href,
      signInFlow: "popup",
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      tosUrl: 'dashboard.html',
      privacyPolicyUrl: 'dashboard.html'
    };
    
    ui.start('#firebase-ui', uiConfig);
  }
});
