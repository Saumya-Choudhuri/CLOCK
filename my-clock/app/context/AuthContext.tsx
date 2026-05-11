"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeFirebase } from "@/app/utils/firebase";
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
  lastActivityDate: number;
  taskHistory: any[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  createUserProfile: (additionalData?: Partial<UserData>) => Promise<void>;
  checkFreeTrial: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = initializeFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
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
    const { auth } = initializeFirebase();
    if (!auth) throw new Error("Firebase not initialized");
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile({
        email: result.user.email || undefined,
      });
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw error;
    }
  };

  const createUserProfile = async (additionalData?: Partial<UserData>) => {
    if (!user) return;

    const newUserData: UserData = {
      uid: user.uid,
      email: user.email || undefined,
      phone: user.phoneNumber || undefined,
      signupDate: Date.now(),
      isPremium: false,
      lastActivityDate: Date.now(),
      taskHistory: [],
      ...additionalData,
    };

    setUserData(newUserData);
    localStorage.setItem(`user_${user.uid}`, JSON.stringify(newUserData));
  };

  const checkFreeTrial = (): boolean => {
    if (!userData) return false;
    const daysSinceSignup = (Date.now() - userData.signupDate) / (1000 * 60 * 60 * 24);
    return daysSinceSignup < 21;
  };

  const signOutUser = async () => {
    const { auth } = initializeFirebase();
    if (!auth) throw new Error("Firebase not initialized");
    
    try {
      await signOut(auth);
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
