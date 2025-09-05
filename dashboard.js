auth.onAuthStateChanged(user => {
  if (user) {
    const urlparams = new URLSearchParams(window.location.search);
    const id = urlparams.get('id');
   document.getElementById('pay-button').addEventListener("click",()=>{
  window.location.href=`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=https://go-starter-ai.vercel.app/api/githubAuthFlow&scope=repo&id=${id}`
})
    const businessRef = db.ref(`users/${user.uid}/businesses/${id}`)
    businessRef.once("value").then(snapshot => {
      if (snapshot) {
        const data = snapshot.val()
        document.getElementById("website-preview-iframe").srcdoc = data.websiteCode
        document.getElementById("business-name"). innerHTML=data.businessName
      }
    })
  }else{
    window.location.href='index.html'

  }
})