/**
 * Pushes HTML and GitHub Actions workflow files to a new repository
 * using the Contents API.
 *
 * @param {string} accessToken - The GitHub access token.
 * @param {string} repoOwner - The owner of the repository.
 * @param {string} repoName - The name of the repository.
 * @param {string} websiteCode - The HTML content to be pushed.
 * @returns {Promise<object>} A success status or an error message.
 */
const pushCodeToRepo = async (accessToken, repoOwner, repoName, websiteCode) => {
  const headers = {
    'Authorization': `token ${accessToken}`,
    'Accept': 'application/vnd.github.com+json', // Use this header for Contents API
  };
  const baseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;

  const workflowContent = `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches:\n      - main\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n\n      - name: Setup Pages\n        id: pages\n        uses: actions/configure-pages@v3\n\n      - name: Upload artifact\n        uses: actions/upload-pages-artifact@v2\n        with:\n          path: './'\n\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v1`;

  try {
    // 1. Push index.html - This will create a new commit.
    const indexFileResponse = await axios.put(`${baseUrl}index.html`, {
      message: 'Initial commit: Add website code',
      content: Buffer.from(websiteCode).toString('base64'),
      branch: 'main'
    }, { headers });

    // 2. Get the SHA of the new index.html file to prove the commit happened.
    const newFileSha = indexFileResponse.data.commit.sha;

    // 3. Push the GitHub Actions workflow file using the new commit SHA as the base.
    const workflowFileResponse = await axios.put(`${baseUrl}.github/workflows/deploy.yml`, {
      message: 'Initial commit: Add deploy workflow',
      content: Buffer.from(workflowContent).toString('base64'),
      branch: 'main',
      sha: newFileSha 
    }, { headers });

    console.log("Code and workflow pushed successfully.");
    return { success: true };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`Error pushing code to repository: ${errorMessage}`, error.response?.data);
    return { success: false, error: errorMessage };
  }
};
