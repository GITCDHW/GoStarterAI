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

document.addEventListener("DOMContentLoaded", (e) => {
  e.preventDefault();
  auth.onAuthStateChanged(user => {
    if (user) {
      const urlparams = new URLSearchParams(window.location.search);
      const id = urlparams.get('id');
      const businessRef = db.ref(`users/${user.uid}/businesses/${id}`);
      console.log(user)
      console.log(db)
      // Add a reference to the GitHub repo link container
      const repoLinkContainer = document.createElement('div');
      repoLinkContainer.className = 'repo-link-container';
      repoLinkContainer.style.display = 'none'; // Initially hidden
      repoLinkContainer.style.textAlign = 'center';
      repoLinkContainer.style.marginTop = '20px';

      const repoLinkParagraph = document.createElement('p');
      repoLinkParagraph.innerHTML = 'Your website is live!';
      repoLinkParagraph.style.fontSize = '1.2em';
      repoLinkParagraph.style.color = '#4A90E2';
      repoLinkParagraph.style.marginBottom = '10px';

      const repoLinkAnchor = document.createElement('a');
      repoLinkAnchor.id = 'repo-link';
      repoLinkAnchor.style.fontSize = '1.1em';
      repoLinkAnchor.style.color = '#3B7CDA';
      repoLinkAnchor.style.textDecoration = 'underline';
      repoLinkAnchor.style.wordBreak = 'break-all'; // Ensures long links wrap
      repoLinkAnchor.target = '_blank'; // Opens in a new tab

      repoLinkContainer.appendChild(repoLinkParagraph);
      repoLinkContainer.appendChild(repoLinkAnchor);

      // Insert the new container before the existing website preview
      const websitePreviewSection = document.querySelector('.website-preview');
      websitePreviewSection.insertBefore(repoLinkContainer, websitePreviewSection.querySelector('.iframe-container'));

      // Listener for the pay button
      document.getElementById('pay-button').addEventListener("click", async () => {
        try {
          const idToken = await user.getIdToken();
          console.log(idToken)
          const state = generateSecureKey(32);
          const stateRef = db.ref(`oauth_states/${state}`);
          await stateRef.set({
            userId: user.uid,
            businessId: id,
            idToken: idToken,
            timestamp: new Date().getTime()
          });
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
          document.querySelector("#container").style.display = "block";
          document.getElementById("business-name").innerHTML = data.businessName;

          if (data.isHosted === false) {
            document.getElementById("website-preview-iframe").srcdoc = data.websiteCode;
            document.getElementById('pay-button').style.display = 'block';
            repoLinkContainer.style.display = 'none'; // Ensure repo link is hidden
          } else { // isHosted === true
            // Hide the launch button and the original preview paragraph
            document.getElementById('pay-button').style.display = 'none';
            document.querySelector('.website-preview p').style.display = 'none';

            // Show the repo link container and set the link
            repoLinkContainer.style.display = 'block';
            const repoLinkAnchorElement = document.getElementById('repo-link');
            repoLinkAnchorElement.href = data.hostedRepoLink;
            repoLinkAnchorElement.textContent = data.hostedRepoLink;

            // Display the hosted website in the iframe
            document.getElementById("website-preview-iframe").src = data.websiteCode;
          }
        }
      });
    } else {
      window.location.href = 'index.html';
    }
  });
});
