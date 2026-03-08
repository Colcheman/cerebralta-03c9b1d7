import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  cpf: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (cpf: string, password: string) => boolean;
  register: (cpf: string, name: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (_cpf: string, _password: string) => {
    // Mock login — real implementation needs Lovable Cloud
    setUser({ cpf: _cpf, name: "Guerreiro Estoico" });
    return true;
  };

  const register = (cpf: string, name: string, _password: string) => {
    setUser({ cpf, name });
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
