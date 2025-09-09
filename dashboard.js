/**
 * // Function to generate a random array of 32-bit unsigned integers
function getRandomValues(array) {
  if (window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  } else {
    // Fallback for older browsers (not recommended for production)
    console.warn("Web Crypto API not available. Falling back to less secure Math.random()");
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 4294967296); // 2^32
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

// Example usage: generate a 64-character hex key (32 bytes)
const key = generateSecureKey(32);
console.log(key);
**/

auth.onAuthStateChanged(user => {
  if (user) {
    const urlparams = new URLSearchParams(window.location.search);
    const id = urlparams.get('id');

    // Attach event listener for the payment button.
    document.getElementById('pay-button').addEventListener("click", () => {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23linWOyvfwx9QlrcC&redirect_uri=https://go-starter-ai.vercel.app/api/githubAuthFlow&scope=repo&id=${id}`;
    });

    const businessRef = db.ref(`users/${user.uid}/businesses/${id}`);
    businessRef.once("value").then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("website-preview-iframe").srcdoc = data.websiteCode;
        document.getElementById("business-name").innerHTML = data.businessName;
      }
    });
  } else {
    window.location.href = 'index.html';
  }
});
