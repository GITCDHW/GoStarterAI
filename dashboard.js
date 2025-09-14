// Function to generate a random array of 32-bit unsigned integers
function getRandomValues(array) {
  if (window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  } else {
    console.warn("Web Crypto API not available. Falling back to less secure Math.random()");
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 4294967296);
    }
    return array;
  }
}

// Function to convert a number to a 2-digit hex string
function toHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

// Function to generate a random hex string of a specified length
function generateSecureKey(length) {
  const buffer = new Uint8Array(length);
  window.crypto.getRandomValues(buffer);
  let key = '';
  for (const byte of buffer) {
    key += toHex(byte);
  }
  return key;
}

document.querySelector(".full-screen-dashboard").style.display = "flex";
document.addEventListener("DOMContentLoaded", (e) => {
  e.preventDefault();
  auth.onAuthStateChanged(user => {
    if (user) {
      const urlparams = new URLSearchParams(window.location.search);
      const id = urlparams.get('id');

      const businessRef = db.ref(`users/${user.uid}/businesses/${id}`);
      document.getElementById('pay-button').addEventListener("click", async () => {
        try {
          // 1. Get the Firebase ID token for authentication
          const idToken = await user.getIdToken();

          // 2. Generate a secure state parameter
          const state = generateSecureKey(32);

          // 3. Store the state and associated data (including the ID token) in Firebase
          const stateRef = db.ref(`oauth_states/${state}`);
          await stateRef.set({
            userId: user.uid,
            businessId: id,
            idToken: idToken,
            timestamp: new Date().getTime() // Optional: add timestamp for cleanup
          });

          // 4. Redirect the user to GitHub with the state parameter
          const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=Ov23lizZuAlUUkJtG5sd&redirect_uri=https://go-starter-ai.vercel.app/api/githubAuthFlow&scope=repo&state=${state}`;
          window.location.href = githubAuthUrl;

        } catch (error) {
          console.error("Failed to store state or get ID token:", error);
          alert("An error occurred. Please try again.");
        }
      });

      businessRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.isHosted === false) {
            document.querySelector("#container").style.display = "block";
            document.getElementById("website-preview-iframe").srcdoc = data.websiteCode;
            document.getElementById("business-name").innerHTML = data.businessName;
          }
        }
      });
    } else {
      window.location.href = 'index.html';
    }
  });
});
