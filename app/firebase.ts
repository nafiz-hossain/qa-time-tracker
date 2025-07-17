import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDf2kwsWOG_YQvJ9U56oSndcvnmmYvk9kQ",
  authDomain: "timetracker-df513.firebaseapp.com",
  projectId: "timetracker-df513",
  storageBucket: "timetracker-df513.appspot.com",
  messagingSenderId: "246261216218",
  appId: "1:246261216218:web:4931813546dd620c7d46e3",
  measurementId: "G-53M124TH14"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics, GoogleAuthProvider, signInWithPopup }; 