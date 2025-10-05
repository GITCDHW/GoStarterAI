//oac_RUDeJT0jXHfF3sgQWX2nlZ2

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
      
      // Get references to the existing elements
      const payButton = document.getElementById('pay-button');
      const downloadButton = document.getElementById('download-report-btn');
      const hostButton = document.getElementById('host-repo');
      const businessNameElement = document.getElementById('business-name');
      const repoLinkContainer = document.getElementById('repo-link-container');
      const repoLinkAnchorElement = document.getElementById('repo-link');
      const websiteIframe = document.getElementById('website-preview-iframe');

      // Add a listener for the pay button
      if (payButton) {
        payButton.addEventListener("click", async () => {
          try {
            const idToken = await user.getIdToken();
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
      }
      
      businessRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          document.querySelector("#container").style.display = "block";
          if (businessNameElement) {
              businessNameElement.innerHTML = data.businessName;
          }
          
          if (data.isHosted === false && data.isDeployed===null) {
            if (websiteIframe) {
              websiteIframe.srcdoc = data.websiteCode;
            }
            if (payButton) payButton.style.display = 'block';
            if (repoLinkContainer) repoLinkContainer.style.display = 'none';
            if (downloadButton) downloadButton.style.display = 'none';
          } else { // isHosted === true
          if (hostButton) {
            hostButton.style.display = 'block'
               hostButton.addEventListener("click", async () => {
     try {
       const idToken = await user.getIdToken();
       // 1. Generate a new secure state
       const state = generateSecureKey(32);
       const stateRef = db.ref(`vercel_oauth_states/${state}`);
       
       // 2. Save the state and user info to the database
       await stateRef.set({
         repoUrl:data.hostedRepoLink,
         businessName:data.businessName.toLowerCase().replace('',"-"),
         timestamp: new Date().getTime()
       });
       
       // 3. Construct the Vercel OAuth URL
       const vercelClientId = 'oac_RU6DeJT0jXHfF3sgQWX2nlZ2'; 
       const client_slug="gostarteraiauth"
       const vercelAuthUrl = `https://vercel.com/integrations/${client_slug}/new?state=${state}`;
       
       window.location.href = vercelAuthUrl;
       
     } catch (error) {
       console.error("Failed to store state or get ID token for Vercel:", error);
       alert("An error occurred during the Vercel authorization process. Please try again.");
     }
   });
          }
            if (payButton) payButton.style.display = 'none';
            if (repoLinkContainer) {
              repoLinkContainer.style.display = 'block';
              if (repoLinkAnchorElement) {
                repoLinkAnchorElement.href = data.hostedRepoLink;
                repoLinkAnchorElement.textContent = `Your GitHub Repo Link:data.hostedRepoLink`;
              }
            }
            if (websiteIframe) {
                websiteIframe.srcdoc = data.websiteCode;
            }
            if (downloadButton) {
              downloadButton.style.display = 'block';
              downloadButton.addEventListener('click', () => {
                if (data.marketReport) {
                  const doc = new window.jspdf.jsPDF();
                  const margin = 10;
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight = doc.internal.pageSize.getHeight();
                  let y = 40;
                  const lineHeight = 10;
                  const text = data.marketReport;
                  
                  doc.setFontSize(22);
                  doc.text(`Market Report for ${data.businessName}`, pageWidth / 2, 20, { align: 'center' });
                  
                  doc.setFontSize(12);
                  const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
                  
                  for (let i = 0; i < splitText.length; i++) {
                    if (y + lineHeight > pageHeight - margin) {
                      doc.addPage();
                      y = margin;
                    }
                    doc.text(splitText[i], margin, y);
                    y += lineHeight;
                  }
                  
                  doc.save(`${data.businessName.replace(/\s/g, '-')}-market-report.pdf`);
                } else {
                  alert("Market report is not available.");
                }
              });
            }
          }
        }
      });
    } else {
      window.location.href = 'index.html';
    }
  });
});
