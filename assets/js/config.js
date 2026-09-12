/* Cash Daftar — client config
   Web-app config from Firebase console → Project settings → Your apps → Cash Daftar Web.
   The web API key is a public identifier (safe in a static site); access is controlled by Auth + Firestore rules.
   Region must match setGlobalOptions() in functions/index.js. */
window.CD_CONFIG = {
  firebase: {
    apiKey: "AIzaSyAtVfFMoir6E1-iZ33OawbMSriyqQxJTCU",
    authDomain: "cash-daftar.firebaseapp.com",
    projectId: "cash-daftar",
    storageBucket: "cash-daftar.firebasestorage.app",
    messagingSenderId: "290585790088",
    appId: "1:290585790088:web:4f0fc3cb33bbfef69e813d",
  },
  functionsRegion: "us-central1",
  appName: "Cash Daftar",
  waNumber: "96522260820",
};
