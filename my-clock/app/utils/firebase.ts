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

// Lazy singleton for client-side Firebase initialization
let firebaseInstance: {
  app: any;
  auth: Auth;
  db: any;
} | null = null;

export const getFirebaseInstance = () => {
  if (typeof window === "undefined") {
    // Server-side: don't initialize
    return null;
  }
  
  if (!firebaseInstance) {
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      firebaseInstance = { app, auth, db };
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return null;
    }
  }
  
  return firebaseInstance;
};

export { RecaptchaVerifier, signInWithPhoneNumber };
export default { getFirebaseInstance };
