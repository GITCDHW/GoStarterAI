const firebaseConfig = {
    apiKey: "AIzaSyBh8koErthng6PGBOdtDzi-d5OrPEPWV5M",
    authDomain: "gostarterai.firebaseapp.com",
    projectId: "gostarterai",
    storageBucket: "gostarterai.firebasestorage.app",
    messagingSenderId: "410394099422",
    appId: "1:410394099422:web:4ba469435367567f550c4f",
    measurementId: "G-FQF326L7QB"
  };
var app = firebase.initializeApp(firebaseConfig);
var db=firebase.database()
var rootRef = db.ref("bookList")
var auth = firebase.auth()