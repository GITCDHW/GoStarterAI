//import required modules
import axios from 'axios';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';

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

const db = admin.database();
export default async function handler(req,res) {
  
  if (req.method !== "GET") {
  return res.status(405).json({ error: 'Method Not Allowed' });
}

  const { code, state } = req.query;
if (!code || !state) {
  return res.status(400).json({ error: 'Temporary code or state is missing.' });
}

const stateRef = db.ref(`vercel_oauth_states/${state}`);
const stateSnapshot = await stateRef.once('value');

if (!stateSnapshot.exists()) {
  return res.status(400).json({ error: 'Invalid or expired state parameter.' });
}

const { userId, businessId, idToken } = stateSnapshot.val();
await stateRef.remove();

try{
  const vercelClientId = 'oac_RU6DeJT0jXHfF3sgQWX2nlZ2'; // Vercel Client ID from the client-side code
const vercelClientSecret = process.env.VERCEL_CLIENT_SECRET; // MUST be stored securely as an environment variable
const vercelRedirectUri = 'https://go-starter-ai.vercel.app/api/vercelAuthFlow'; // Matches the one saved earlier

if (!vercelClientSecret) {
  // Good practice: handle missing secret
  console.error("VERCEL_CLIENT_SECRET is missing.");
  return res.status(500).json({ error: 'Server configuration error.' });
}

// 5. Exchange Temporary Code for Access Token
  const tokenResponse = await axios.post('https://api.vercel.com/v2/oauth/access_token', null, {
    params: {
      client_id: vercelClientId,
      client_secret: vercelClientSecret,
      code: code,
      redirect_uri: vercelRedirectUri,
    },
    // Vercel token exchange uses query parameters, not a JSON body
  });

  const { access_token, user_id, team_id } = tokenResponse.data;

  // 6. Save the Access Token
  // This token is needed for making future deployments/API calls to Vercel on the user's behalf.
  const vercelTokenRef = db.ref(`users/${userId}/vercel_token`); 
  await vercelTokenRef.set({
    accessToken: access_token,
    vercelUserId: user_id, // Vercel User ID
    vercelTeamId: team_id || null, // Vercel Team ID (if applicable)
    // Optional: save the businessId if you need to know which business this token relates to specifically
  });

  // 7. Success Response and Redirect
  // Once the token is saved, you should redirect the user back to the application's dashboard or relevant page.
  // Using a redirect is standard practice after a successful server-side OAuth step.
  return res.redirect(`/business-details.html?id=${businessId}&success=vercel_auth`);

} catch (error) {
  console.error("Vercel token exchange failed:", error.response ? error.response.data : error.message);
  // Redirect to an error page or back to the app with an error message
  return res.redirect(`/error.html?message=Vercel+Authorization+Failed`);
}

}