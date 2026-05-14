"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getFirebaseInstance } from "@/app/utils/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

interface UserData {
  uid: string;
  email?: string;
  username?: string;
  phone?: string;
  signupDate: number;
  isPremium: boolean;
  premiumUntil?: number;
  lastActivityDate: number;
  taskHistory: any[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signOutUser: () => Promise<void>;
  createUserProfile: (
    additionalData?: Partial<UserData>,
    userOverride?: FirebaseUser
  ) => Promise<void>;
  checkFreeTrial: () => boolean;
  checkPremiumAccess: () => boolean;
  activateMonthlyPremium: (userOverride?: FirebaseUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TRIAL_DAYS = 7;
const PREMIUM_MONTH_DAYS = 30;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseInstance = getFirebaseInstance();
    if (!firebaseInstance?.auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseInstance.auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Fetch user data from localStorage for now (we'll migrate to Firestore later)
        const storedData = localStorage.getItem(`user_${authUser.uid}`);
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const firebaseInstance = getFirebaseInstance();
    if (!firebaseInstance?.auth) {
      throw new Error("Firebase is not available. Please try again later.");
    }
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseInstance.auth, provider);
      setUser(result.user);
      await createUserProfile(
        {
          email: result.user.email || undefined,
        },
        result.user
      );
      return result.user;
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw error;
    }
  };

  const createUserProfile = async (
    additionalData?: Partial<UserData>,
    userOverride?: FirebaseUser
  ) => {
    const activeUser = userOverride ?? user;
    if (!activeUser) return;

    const storedData = localStorage.getItem(`user_${activeUser.uid}`);
    const existingData = storedData ? JSON.parse(storedData) : null;

    const baseData: UserData = existingData || {
      uid: activeUser.uid,
      email: activeUser.email || undefined,
      phone: activeUser.phoneNumber || undefined,
      signupDate: Date.now(),
      isPremium: false,
      lastActivityDate: Date.now(),
      taskHistory: [],
    };

    const updatedUserData: UserData = {
      ...baseData,
      ...additionalData,
      lastActivityDate: Date.now(),
    };

    setUserData(updatedUserData);
    localStorage.setItem(`user_${activeUser.uid}`, JSON.stringify(updatedUserData));
  };

  const checkFreeTrial = (): boolean => {
    if (!userData) return false;
    const daysSinceSignup = (Date.now() - userData.signupDate) / (1000 * 60 * 60 * 24);
    return daysSinceSignup < TRIAL_DAYS;
  };

  const checkPremiumAccess = (): boolean => {
    if (!userData?.isPremium || !userData.premiumUntil) return false;
    return Date.now() < userData.premiumUntil;
  };

  const activateMonthlyPremium = async (userOverride?: FirebaseUser) => {
    const activeUser = userOverride ?? user;
    if (!activeUser) {
      throw new Error("Please sign in to activate Monthly Premium.");
    }

    const storedData = localStorage.getItem(`user_${activeUser.uid}`);
    const existingData = storedData ? JSON.parse(storedData) : null;

    const baseData: UserData = existingData || {
      uid: activeUser.uid,
      email: activeUser.email || undefined,
      phone: activeUser.phoneNumber || undefined,
      signupDate: Date.now(),
      isPremium: false,
      lastActivityDate: Date.now(),
      taskHistory: [],
    };

    const premiumUntil = Date.now() + PREMIUM_MONTH_DAYS * 24 * 60 * 60 * 1000;

    const updatedUserData: UserData = {
      ...baseData,
      isPremium: true,
      premiumUntil,
      lastActivityDate: Date.now(),
    };

    setUserData(updatedUserData);
    localStorage.setItem(`user_${activeUser.uid}`, JSON.stringify(updatedUserData));
  };

  const signOutUser = async () => {
    const firebaseInstance = getFirebaseInstance();
    if (!firebaseInstance?.auth) {
      throw new Error("Firebase is not available. Please try again later.");
    }
    
    try {
      await signOut(firebaseInstance.auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signOutUser,
        createUserProfile,
        checkFreeTrial,
        checkPremiumAccess,
        activateMonthlyPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
