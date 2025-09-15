//import required modules
import axios from 'axios';
import admin from 'firebase-admin';

const serviceAccount = {
    "type": "service_account",
    "project_id": "gostarterai",
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": "firebase-adminsdk-fbsvc@gostarterai.iam.gserviceaccount.com",
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID, 
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gostarterai.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://gostarterai-default-rtdb.firebaseio.com",
    });
}

const db = admin.database()

/**
 * Pushes HTML and GitHub Actions workflow files to a new repository.
 * @param {string} accessToken - The GitHub access token.
 * @param {string} repoOwner - The owner of the repository (e.g., the authenticated user's username).
 * @param {string} repoName - The name of the repository.
 * @param {string} websiteCode - The HTML content to be pushed.
 * @returns {Promise<object>} A success status or an error message.
 */
const pushCodeToRepo = async (accessToken, repoOwner, repoName, websiteCode) => {
    try {
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
        const headers = {
            'Authorization': `token ${accessToken}`,
            'Content-Type': 'application/json',
        };
        const commitMessage = 'Initial commit: Add website code and deploy workflow';

        // 1. Create index.html file. This commit will automatically create the 'main' branch.
        const htmlPayload = {
            message: commitMessage,
            content: Buffer.from(websiteCode).toString('base64'),
        };
        await axios.put(apiUrl + 'index.html', htmlPayload, { headers });

        // 2. Create GitHub Pages workflow file.
        // The `branch` parameter is intentionally removed.
        const workflowContent = `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches:\n      - main\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n\n      - name: Setup Pages\n        id: pages\n        uses: actions/configure-pages@v3\n\n      - name: Upload artifact\n        uses: actions/upload-pages-artifact@v2\n        with:\n          path: './'\n\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v1`;
        
        const workflowPayload = {
            message: commitMessage,
            content: Buffer.from(workflowContent).toString('base64'),
        };
        await axios.put(apiUrl + '.github/workflows/deploy.yml', workflowPayload, { headers });

        console.log("Code and workflow pushed successfully.");
        return { success: true };
    } catch (error) {
        console.error('Error pushing code to repository:', error.response?.data?.message || error.message);
        return { success: false, error: error.response?.data?.message || 'An unknown error occurred.' };
    }
};

// Main handler for the Cloud Function.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.status(400).json({ error: 'Temporary code or state is missing.' });
  }

  const stateRef = db.ref(`oauth_states/${state}`);
  const stateSnapshot = await stateRef.once('value');
  
  if (!stateSnapshot.exists()) {
    return res.status(400).json({ error: 'Invalid or expired state parameter.' });
  }

  const { userId, businessId, idToken } = stateSnapshot.val();
  await stateRef.remove(); // Clean up the state to prevent replay attacks

  // Use the Firebase Admin SDK to verify the ID token.
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid Firebase ID token.' });
  }

  const authenticatedUid = decodedToken.uid;
  
  // Crucial security check: Ensure the UID from the token matches the stored UID.
  if (authenticatedUid !== userId) {
    return res.status(403).json({ error: 'Forbidden: Session user mismatch. Potential CSRF attack.' });
  }

  const businessRef = db.ref(`users/${userId}/businesses/${businessId}`);
  const businessSnapshot = await businessRef.once('value');
  
  if (!businessSnapshot.exists()) {
    return res.status(404).json({ error: 'Business not found.' });
  }
  
  const businessData = businessSnapshot.val();
  const repoName = businessData.businessName.toLowerCase().replace(/\s+/g, '-');
  
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const GITHUB_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';

  try {
    const response = await fetch(GITHUB_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub token exchange failed:', errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Access token not found in response.' });
    }

    const repoCreationResult = await createNewRepo(accessToken, repoName);

    if (repoCreationResult.success) {
      
      pushCodeToRepo(accessToken,repoCreationResult.full_name.split("/")[0],repoName,businessData.websiteCode)
      
      await businessRef.update({
        isHosted: true,
        hostedUrl:`https://${repoCreationResult.full_name.split("/")[0]}.github.io/${repoName}`,
      });
      
      return res.redirect(`https://go-starter-ai.vercel.app/dashboard.html?id=${businessId}`);
    } else {
      console.error('Failed to create repository:', repoCreationResult.error);
      return res.status(500).json({ error: repoCreationResult.error });
    }

  } catch (error) {
    console.error('Error during GitHub OAuth token exchange:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
