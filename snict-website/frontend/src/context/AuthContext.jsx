import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  const loadUser = async () => {
    try {
      const response =
        await api.get("/auth/profile");

      if (
        response.data?.success &&
        response.data?.user
      ) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }

    } catch (error) {

      // 401 simply means user is not logged in.
      if (
        error.response?.status !== 401
      ) {
        console.error(
          "Load user error:",
          error
        );
      }

      setUser(null);

    } finally {

      setLoading(false);

    }
  };

  // =========================================================
  // INITIAL AUTH CHECK
  // =========================================================

  useEffect(() => {
    loadUser();
  }, []);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (
    identifier,
    password
  ) => {

    try {

      const response =
        await api.post(
          "/auth/login",
          {
            identifier:
              identifier.trim(),

            password,
          }
        );

      if (
        response.data?.success &&
        response.data?.user
      ) {

        setUser(
          response.data.user
        );

      }

      return response.data;

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      throw error;

    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {

    try {

      await api.post(
        "/auth/logout"
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    } finally {

      setUser(null);

    }
  };

  // =========================================================
  // CONTEXT
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// USE AUTH HOOK
// =========================================================

export function useAuth() {

  const context =
    useContext(AuthContext);

  if (context === null) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }

  return context;
}