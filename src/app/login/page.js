import AuthPage from "../Components/auth/AuthPage";

export const metadata = {
  title: "Sign in | Dvepo Merchant",
  description: "Sign in to your Dvepo merchant account.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
