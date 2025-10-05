//import required modules
import axios from 'axios';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';
import qs from 'qs';

// ------------------- FIREBASE INITIALIZATION -------------------
const serviceAccount = {
  type: "service_account",
  project_id: "gostarterai",
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: "firebase-adminsdk-fbsvc@gostarterai.iam.gserviceaccount.com",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gostarterai.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gostarterai-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();

/**
 * Extracts the 'owner/repo-name' ID from a GitHub repository URL.
 * * @param {string} url - The GitHub repository URL.
 * @returns {string|null} The repo ID (e.g., 'facebook/react') or null if invalid.
 */
const extractRepoIdFromUrl = (url) => {
  try {
    // 1. Create a URL object to easily access the pathname
    const urlObject = new URL(url);

    // 2. The pathname will be something like '/owner/repo-name' (or more)
    let pathname = urlObject.pathname;

    // 3. Remove leading/trailing slashes
    pathname = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    pathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    // 4. Split the path by '/'
    const pathSegments = pathname.split('/');

    // 5. A valid repo URL should have at least 2 segments (owner and repo name)
    if (pathSegments.length >= 2) {
      // Return the first two segments joined by '/'
      // This handles URLs like 'https://github.com/owner/repo-name/blob/main/...'
      return `${pathSegments[0]}/${pathSegments[1]}`;
    }

    return null; // Path is too short
  } catch (error) {
    // Handle cases where the input is not a valid URL
    console.error("Invalid URL provided:", error.message);
    return null;
  }
};


// ------------------- DEPLOYMENT FUNCTION -------------------
const deployToVercel = async (accessToken, repoUrl, projectName) => {
  try {
    const repoSlug = extractRepoIdFromUrl(repoUrl); // Renamed to slug for clarity
    if (!repoSlug) throw new Error("Invalid repository URL");
    
    const projectPayload = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      gitRepository: { type: 'github', repo: repoSlug }, // GitHub slug (owner/repo)
      publicSource: true,
      outputDirectory: "public",
      // Include optional framework preset for better setup, e.g.:
      // framework: "nextjs"
    };
    
    // 1️⃣ Create project
    // Note: Using /v9/projects is recommended over /v11 for project creation
    const projectResponse = await axios.post(
      'https://api.vercel.com/v9/projects',
      projectPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const vercelProjectId = projectResponse.data.id;
    // The Vercel API response for creating a project contains the GitHub numeric ID in the 'link' object.
    const githubRepoId = projectResponse.data.link.repoId; 
    
    console.log(`[GoStarterAI][VercelDeploy] Project created: ${projectResponse.data.name} (Vercel ID: ${vercelProjectId})`);
    
    
    // 2️⃣ Trigger deployment
    const deploymentPayload = {
        name: projectPayload.name,
        project: vercelProjectId,
        gitSource: {
          type: 'github',
          repoId: githubRepoId,
          ref: 'main'
        },
    };

    const deployResponse = await axios.post(
      'https://api.vercel.com/v13/deployments',
      deploymentPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    console.log(`[GoStarterAI][VercelDeploy] Deployment started: ${deployResponse.data.url}`);
    
    // The deployment URL is often returned as the domain, e.g., my-project-xxxx.vercel.app
    return deployResponse.data;
    
  } catch (e) {
    // Better error logging for Vercel API responses
    const errorDetails = e.response ? JSON.stringify(e.response.data) : e.message;
    console.error('[GoStarterAI][VercelDeploy] Failed:', errorDetails);
    throw e;
  }
};
// ------------------- MAIN HANDLER -------------------
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).json({ error: 'Temporary code or state is missing.' });
  }

  // Validate state from Firebase
  const stateRef = db.ref(`vercel_oauth_states/${state}`);
  const stateSnapshot = await stateRef.once('value');

  if (!stateSnapshot.exists()) {
    return res.status(400).json({ error: 'Invalid or expired state parameter.' });
  }

  const { repoUrl, businessName, businessId,userId } = stateSnapshot.val();
  await stateRef.remove();

  try {
    // Vercel OAuth setup
    const vercelClientId = 'oac_RU6DeJT0jXHfF3sgQWX2nlZ2';
    const vercelClientSecret = process.env.VERCEL_CLIENT_SECRET;
    const vercelRedirectUri = 'https://go-starter-ai.vercel.app/api/vercelAuthFlow';

    if (!vercelClientSecret) {
      console.error("[GoStarterAI] Missing VERCEL_CLIENT_SECRET");
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.vercel.com/v2/oauth/access_token',
      qs.stringify({
        client_id: vercelClientId,
        client_secret: vercelClientSecret,
        code,
        redirect_uri: vercelRedirectUri,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token } = tokenResponse.data;

    // Trigger deployment
    const deployResult = await deployToVercel(access_token, repoUrl, businessName);

    // ------------------- UPDATE FIREBASE -------------------
    const vercelUrl = deployResult?.url ? `https://${deployResult.url}` : null;
    await db.ref(`users/${userId}/businesses/${businessId}`).update({
      isDeployed: true,
      vercelUrl: vercelUrl || null,
      deploymentTimestamp: Date.now(),
    });

    console.log(`[GoStarterAI][Firebase] Updated deployment info for business ${businessId}`);

    // Redirect to dashboard
    return res.redirect(
      `https://go-starter-ai.vercel.app/dashboard.html?id=${businessId}&success=vercel_auth`
    );

  } catch (error) {
    console.error(
      "[GoStarterAI][OAuthFlow] Vercel token exchange or deployment failed:",
      error.response ? error.response.data : error.message
    );
    return res.redirect(
      `https://go-starter-ai.vercel.app/error.html?message=Vercel+Authorization+Failed`
    );
  }
}