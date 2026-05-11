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

// Lazy initialization to avoid errors during static build
let app: any = null;
let auth: Auth | null = null;
let db: any = null;

const initializeFirebase = () => {
  if (typeof window === "undefined") {
    // Server-side: don't initialize
    return { app: null, auth: null, db: null };
  }
  
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }
  
  return { app, auth, db };
};

export { RecaptchaVerifier, signInWithPhoneNumber, initializeFirebase };
export default { initializeFirebase };
