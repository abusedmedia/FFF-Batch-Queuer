import { Center, Loader } from "@mantine/core";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { authRequired, isAuthenticated } = useAuth();
  const location = useLocation();

  if (authRequired === null) {
    return (
      <Center mih="100dvh">
        <Loader />
      </Center>
    );
  }

  if (authRequired && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
