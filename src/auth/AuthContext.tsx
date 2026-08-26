import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "../firebase";
import { googleOAuthConfig } from "../firebase/config";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signingIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleOAuthConfig.webClientId,
    iosClientId: googleOAuthConfig.iosClientId,
    androidClientId: googleOAuthConfig.androidClientId,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        setSigningIn(true);
        try {
          const { id_token, access_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token, access_token);
          await signInWithCredential(auth, credential);
        } catch (e: any) {
          setError(e?.message ?? "Sign-in failed");
        } finally {
          setSigningIn(false);
        }
      } else if (response?.type === "error") {
        setError("Google sign-in was cancelled or failed");
      }
    })();
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    setSigningIn(true);
    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        await promptAsync();
      }
    } catch (e: any) {
      setError(e?.message ?? "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = useMemo(
    () => ({ user, initializing, signingIn, error, signInWithGoogle, signOut }),
    [user, initializing, signingIn, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
