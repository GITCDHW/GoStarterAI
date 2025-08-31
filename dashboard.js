const urlparams = new URLSearchParams(window.location.search);
const id = urlparams.get('id');
const businessRef=db.ref(`users/businesses/${id}`)
businessRef.once("value").then(snapshot=>{
  if (snapshot) {
    const data=snapshot.val()
    document.getElementById("website-preview-iframe").srcdoc=data.websiteCode
  }
})