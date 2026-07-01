import { redirect } from "next/navigation";

// Sign-in lives on the /welcome splash (Clerk <SignIn/> with hash routing).
// This route exists only so Clerk's default sign-in URL resolves; it forwards.
export default function SignInPage() {
  redirect("/welcome");
}
