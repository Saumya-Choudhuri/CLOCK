import { initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase config from Firebase Console
// Get this from: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase once so the app, auth, and database handles are always defined.
// The config values come from environment variables during local development and GitHub Actions.
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
