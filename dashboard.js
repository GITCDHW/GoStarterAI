document.getElementById('pay-button').addEventListener("click",()=>{
  
})
auth.onAuthStateChanged(user => {
  if (user) {
    const urlparams = new URLSearchParams(window.location.search);
    const id = urlparams.get('id');
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