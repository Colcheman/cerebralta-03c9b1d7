import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/feed" replace />;
  return <Navigate to="/" replace />;
};

export default Index;
