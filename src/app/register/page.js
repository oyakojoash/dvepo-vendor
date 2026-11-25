import AuthPage from "../Components/auth/AuthPage";

export const metadata = {
  title: "Create account | Dvepo Merchant",
  description: "Create a Dvepo merchant account.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
