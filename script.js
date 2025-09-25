// Function to render the list of businesses
function renderBusinesses(businesses) {
    const businessGrid = document.getElementById("business-list");
    businessGrid.innerHTML = ''; // Clear previous cards
    
    if (businesses) {
        Object.keys(businesses).forEach(key => {
            const business = businesses[key];
            const card = document.createElement("div");
            card.className = "business-card";
            
            // Determine the status
            const statusText = 'LIVE'; // The design only shows "LIVE"
            const statusClass = 'status-live';
            
            card.innerHTML = `
                <span class="status-badge ${statusClass}">${statusText}</span>
                <div class="card-content">
                    <h3>${business.businessName}</h3>
                    <p>Click to manage your business</p>
                </div>
                <div class="card-actions">
                    <a href="dashboard.html?id=${key}" class="card-link">View Dashboard</a>
                </div>
            `;
            
            // Add a click listener to the entire card for navigation
            card.addEventListener('click', () => {
                window.location.href = `dashboard.html?id=${key}`;
            });
            
            businessGrid.appendChild(card);
        });
    } else {
        // Updated message for no businesses
        businessGrid.innerHTML = '<p style="text-align:center; color:#777;">No businesses found. Click "Launch New Business" to get started!</p>';
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
    // Hide the loader initially, as per your original request
    document.getElementById("loading-overlay").style.display = "none";
    const promptModal = document.getElementById("prompt-modal");
    promptModal.style.display='none'
    // Set up the Firebase UI for unauthenticated users
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    const uiConfig = {
        signInSuccessUrl: window.location.href, // Redirect back to this page
        signInFlow: "popup",
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        tosUrl: 'dashboard.html',
        privacyPolicyUrl: 'dashboard.html'
    };

    // Listen for authentication state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User is signed in:", user.uid);
            // Hide the Firebase UI and show the main app content
            document.getElementById("firebase-ui").style.display = "none";
            document.querySelector(".main-container").style.display = "flex";
            
            // Reference to the user's businesses in the database
            const userBusinessesRef = db.ref(`users/${user.uid}/businesses`);
            
            // Listen for changes and render the businesses
            userBusinessesRef.on('value', snapshot => {
                const businesses = snapshot.val();
                renderBusinesses(businesses);
            });

            // --- POPUP LOGIC ---
            const addBusinessBtn = document.getElementById("add-business-btn");
            const closeButton = document.querySelector(".close-button");

            addBusinessBtn.onclick = () => {
                promptModal.style.display = "flex";
            };

            closeButton.onclick = () => {
                promptModal.style.display = "none";
            };

            window.onclick = (event) => {
                if (event.target == promptModal) {
                    promptModal.style.display = "none";
                }
            };

            // --- FORM SUBMISSION LOGIC ---
            const promptForm = document.getElementById("prompt_form");
            promptForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Hide the modal and show the game loader
                promptModal.style.display = "none";
                document.getElementById("loading-overlay").style.display = "flex";
                
                const prompt = document.getElementById("prompt").value.trim();
                const userProvidedName = document.getElementById("name").value.trim();
                
                if (!prompt) {
                    alert("Please enter a business idea.");
                    document.getElementById("loading-overlay").style.display = "none";
                    return;
                }

                let nameData;
                if (userProvidedName) {
                    nameData = { name: userProvidedName };
                } else {
                    nameData = await makeNameApiCall(prompt);
                }
                    
                if (nameData) {
                    const mainApiData = await makeApiCall(prompt, nameData.name);
                    
                    if (mainApiData) {
                        const finalData = {
                            businessName: nameData.name,
                            websiteCode: mainApiData.websiteCode,
                            marketReport: mainApiData.marketReport,
                            isHosted: false,
                            hostedRepoLink: null
                        };
                        const newBusinessRef = userBusinessesRef.push(finalData);
                        const newBusinessKey = newBusinessRef.key;
                        
                        document.getElementById("loading-overlay").style.display = "none";
                        // Redirect to the dashboard page for the newly created business
                        window.location.href = `dashboard.html?id=${newBusinessKey}`;
                    } else {
                        document.getElementById("loading-overlay").style.display = "none";
                        console.error("Main API call failed or returned null data.");
                    }
                } else {
                    document.getElementById("loading-overlay").style.display = "none";
                    console.error("Name API call failed or returned null data.");
                }
            });

            // Logic to create a new user profile on first login
            const userRef = db.ref('users/' + user.uid);
            userRef.once('value').then(snapshot => {
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
            // User is not signed in, show the Firebase UI
            document.querySelector(".main-container").style.display = "none";
            ui.start('#firebase-ui', uiConfig);
        }
    });
});
