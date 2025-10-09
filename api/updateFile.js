// api/updateFile.js
// Node serverless (CommonJS). Paste into Vercel serverless function file.
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Vercel includes fetch but require for older runtimes

// Build service account from env (same pattern you already used)
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}
const db = admin.database();

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed, use POST" });
  }

  try {
    // Expect Firebase ID token in Authorization header
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const idToken = authHeader.split("Bearer ")[1].trim();
    if (!idToken) return res.status(401).json({ error: "Missing ID token" });

    // Verify ID token to get uid
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Body payload
    const { repoFullName, filePath = "index.html", newContent, commitMessage = "Update index.html via GoStarterAI" } = req.body || {};

    if (!repoFullName || !newContent) {
      return res.status(400).json({ error: "Missing repoFullName or newContent in request body" });
    }

    // Retrieve user's GitHub access token stored in RTDB at users/{uid}/gitHubAccessToken
    const tokenSnapshot = await db.ref(`users/${uid}/gitHubAccessToken`).once("value");
    const gitHubAccessToken = tokenSnapshot.val();

    if (!gitHubAccessToken) {
      return res.status(403).json({ error: "No GitHub token found for user. Re-authenticate GitHub." });
    }

    // Normalize repoFullName: owner/repo
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, "/");
    const contentsUrl = `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}`;

    // 1) Get current file to obtain SHA (if exists)
    const getResp = await fetch(contentsUrl, {
      headers: {
        Authorization: `token ${gitHubAccessToken}`,
        "User-Agent": "GoStarterAI-UpdateFunction",
        Accept: "application/vnd.github+json",
      },
    });

    let sha = null;
    if (getResp.status === 200) {
      const data = await getResp.json();
      sha = data.sha;
    } else if (getResp.status === 404) {
      // File doesn't exist — for sniper version we expect index.html to exist, but allow creating if not
      sha = null;
    } else {
      // forward error
      const errText = await getResp.text();
      return res.status(502).json({ error: "Failed to fetch file from GitHub", details: errText });
    }

    // 2) Create commit payload
    const contentBase64 = Buffer.from(newContent, "utf8").toString("base64");

    const putBody = {
      message: commitMessage,
      content: contentBase64,
      branch: "main", // change if your default branch is different. Could be passed in body
    };
    if (sha) putBody.sha = sha;

    const putResp = await fetch(contentsUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${gitHubAccessToken}`,
        "User-Agent": "GoStarterAI-UpdateFunction",
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putBody),
    });

    const putData = await putResp.json();

    if (!putResp.ok) {
      return res.status(putResp.status).json({ error: "GitHub API error", details: putData });
    }

    // success — return commit info and file URL
    return res.status(200).json({
      ok: true,
      commit: putData.commit && putData.commit.html_url,
      content: putData.content && putData.content.html_url,
      message: "index.html updated successfully",
    });
  } catch (err) {
    console.error("updateFile error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
};