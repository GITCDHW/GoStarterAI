// -------------------- UTILITIES --------------------
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

function toHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function generateSecureKey(length) {
  const buffer = new Uint8Array(length);
  window.crypto.getRandomValues(buffer);
  let key = '';
  for (const byte of buffer) {
    key += toHex(byte);
  }
  return key;
}

// -------------------- COPY TO CLIPBOARD --------------------
function addCopyButton(linkElement) {
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '📋';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(linkElement.href).then(() => {
      alert('Link copied to clipboard!');
    });
  });
  linkElement.insertAdjacentElement('afterend', copyBtn);
}

// -------------------- DASHBOARD LOGIC --------------------
document.addEventListener("DOMContentLoaded", (e) => {
  e.preventDefault();
  auth.onAuthStateChanged(user => {
    if (!user) return window.location.href = 'index.html';
    
    const urlparams = new URLSearchParams(window.location.search);
    const id = urlparams.get('id');
    const businessRef = db.ref(`users/${user.uid}/businesses/${id}`);
    
    // Elements
    const payButton = document.getElementById('pay-button');
    const downloadButton = document.getElementById('download-report-btn');
    const hostButton = document.getElementById('host-repo');
    const businessNameElement = document.getElementById('business-name');
    const repoLinkContainer = document.getElementById('repo-link-container');
    const websiteIframe = document.getElementById('website-preview-iframe');
    
    // ---------- PAY / GITHUB OAUTH ----------
    if (payButton) {
      payButton.addEventListener("click", async () => {
        try {
          const idToken = await user.getIdToken();
          const state = generateSecureKey(32);
          await db.ref(`oauth_states/${state}`).set({
            userId: user.uid,
            businessId: id,
            idToken,
            timestamp: new Date().getTime()
          });
          const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=Ov23lizZuAlUUkJtG5sd&redirect_uri=https://go-starter-ai.vercel.app/api/githubAuthFlow&scope=repo&state=${state}`;
          window.location.href = githubAuthUrl;
        } catch (error) {
          console.error(error);
          alert("Error. Try again.");
        }
      });
    }
    
    // ---------- FETCH BUSINESS DATA ----------
    businessRef.once("value").then(snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      document.querySelector("#container").style.display = "block";
      if (businessNameElement) businessNameElement.textContent = data.businessName;
      
      // ---------- DISPLAY LINKS ----------
      if (repoLinkContainer) {
        repoLinkContainer.innerHTML = ''; // clear old content
        repoLinkContainer.style.display = 'none';
        
        if (data.hostedRepoLink || data.vercelUrl) {
          repoLinkContainer.style.display = 'block';
          
          // GitHub link
          if (data.hostedRepoLink) {
            const ghLink = document.createElement('a');
            ghLink.href = data.hostedRepoLink;
            ghLink.target = "_blank";
            ghLink.textContent = "GitHub Repo";
            repoLinkContainer.appendChild(ghLink);
            addCopyButton(ghLink);
          }
          
          // Vercel link
          if (data.vercelUrl) {
            const liveLink = document.createElement('a');
            liveLink.href = data.vercelUrl;
            liveLink.target = "_blank";
            liveLink.textContent = "Live Site";
            repoLinkContainer.appendChild(liveLink);
            addCopyButton(liveLink);
          }
        }
      }
      
      // ---------- WEBSITE PREVIEW ----------
      if (websiteIframe) websiteIframe.srcdoc = data.websiteCode;
      
      // ---------- DOWNLOAD MARKET REPORT ----------
      if (downloadButton) {
        downloadButton.style.display = data.marketReport ? 'block' : 'none';
        downloadButton.onclick = () => {
          if (!data.marketReport) return alert("Market report not available.");
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
        };
      }
      
      // ---------- HOST BUTTON / VERCEL ----------
      if (hostButton) {
        if (data.isHosted && !data.isDeployed) {
          hostButton.style.display = 'block';
          hostButton.onclick = async () => {
            try {
              const idToken = await user.getIdToken();
              const state = generateSecureKey(32);
              await db.ref(`vercel_oauth_states/${state}`).set({
                repoUrl: data.hostedRepoLink,
                businessName: data.businessName
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9._-]/g, '')
                  .replace(/---+/g, '-')
                  .slice(0, 100),
                userId: user.uid,
                businessId: id,
                timestamp: new Date().getTime()
              });
              const vercelAuthUrl = `https://vercel.com/integrations/gostarteraiauth/new?state=${state}`;
              window.location.href = vercelAuthUrl;
            } catch (error) {
              console.error(error);
              alert("Error during Vercel auth. Try again.");
            }
          };
        } else {
          hostButton.style.display = 'none';
        }
      }
      
      // ---------- PAY BUTTON ----------
      if (payButton) {
        payButton.style.display = (data.isHosted || data.isDeployed) ? 'none' : 'block';
      }
      
    });
  });
});