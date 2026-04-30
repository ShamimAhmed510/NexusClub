import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCurrentUser, 
  getGetCurrentUserQueryKey, 
  login, 
  register, 
  logout,
  AuthSession,
  LoginBody,
  RegisterBody
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@workspace/api-client-react";

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  loginMutation: ReturnType<typeof useMutation<AuthSession, Error, LoginBody>>;
  registerMutation: ReturnType<typeof useMutation<AuthSession, Error, RegisterBody>>;
  logoutMutation: ReturnType<typeof useMutation<void, Error, void>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session = null, isLoading } = useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async () => {
      try {
        return await getCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginBody) => {
      const res = await login(data);
      return res;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
      toast({ title: "Welcome back", description: "Successfully logged in." });
    },
    onError: (error: ApiError) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterBody) => {
      const res = await register(data);
      return res;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(getGetCurrentUserQueryKey(), data);
      toast({ title: "Welcome!", description: "Account created successfully." });
    },
    onError: (error: ApiError) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
      queryClient.clear();
      toast({ title: "Logged out", description: "You have been successfully logged out." });
    },
    onError: (error: ApiError) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  });

  return (
    <AuthContext.Provider value={{ session, isLoading, loginMutation, registerMutation, logoutMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}