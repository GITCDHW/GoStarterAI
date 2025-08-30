// API call function
async function makeApiCall(userPrompt) {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: userPrompt })
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
        const response = await fetch("https://go-starter-ai.vercel.app/api/name", requestOptions);
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
    document.getElementById('prompt_form').style.display = 'block';
    
    const promptForm = document.getElementById("prompt_form");

    promptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const prompt = document.getElementById("prompt").value.trim();
      const userProvidedName = document.getElementById("name").value.trim();
      
      if (!prompt) {
        alert("Please enter a business idea.");
        return;
      }

      // Conditionally create a promise for the business name
      const namePromise = userProvidedName ?
        Promise.resolve({ name: userProvidedName }) : // Use a resolved promise if a name is provided
        makeNameApiCall(prompt); // Call the name API if not
      const mainApiPromise = makeApiCall(prompt);
      
      try {
        const [nameData, mainApiData] = await Promise.all([namePromise, mainApiPromise]);
        
        if (nameData && mainApiData) {
          const finalData = {
            BusinessName: nameData.name,
            WebsiteCode: mainApiData.websiteCode,
            MarketReport: mainApiData.marketReport
          };
          
          console.log("Final Combined Data:", finalData);
        } else {
          console.error("One or more API calls failed or returned null data.");
        }
      } catch (error) {
        console.error("Failed to generate content:", error);
        alert("An error occurred. Please check the console.");
      }
    });

    const userRef = db.ref('users/' + user.uid);
    const userBusinessesRef = db.ref(`users/${user.uid}/businesses`)
    
    userRef.once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          // This is a brand new user. Create their profile.
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
