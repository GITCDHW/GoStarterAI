    const promptForm = document.getElementById("prompt_form")
    
    
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
        return data
      } catch (error) {
        console.error("API call failed:", error);
        alert("Something went wrong. Check the console for details.");
        return null;
      }
    }
    
    auth.onAuthStateChanged(user => {
      if (user) {
        console.log("User is signed in:", user.uid);
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
        document.getElementById('promptForm').style.display = 'block';
        promptForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const prompt = document.getElementById("prompt").value.trim();
          if (!prompt) {
            alert("Please enter a business idea.");
            return;
          }
          const data = await makeApiCall(prompt);
          if (data) {
            console.log(data.data)
          } else {
            console.error("data not found")
          }
        })
      } else {
        // User is not signed in. Redirect them to the sign-in page.
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
    })