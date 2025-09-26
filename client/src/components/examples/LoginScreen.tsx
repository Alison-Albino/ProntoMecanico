import { LoginScreen } from "../LoginScreen";

export default function LoginScreenExample() {
  const handleLogin = (credentials: { 
    email: string; 
    password: string; 
    userType: "client" | "provider" 
  }) => {
    console.log("Login successful:", credentials);
    // TODO: remove mock functionality
    alert(`Login successful as ${credentials.userType}: ${credentials.email}`);
  };

  return (
    <LoginScreen onLogin={handleLogin} />
  );
}