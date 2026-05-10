"use client";

import React, { createContext, useContext } from "react";

type AuthModalContextValue = {
  openLogin: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({
  children,
  openLogin,
}: {
  children: React.ReactNode;
  openLogin: () => void;
}) {
  return (
    <AuthModalContext.Provider value={{ openLogin }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
