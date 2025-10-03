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


}