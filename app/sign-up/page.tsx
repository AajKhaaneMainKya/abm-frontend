import { redirect } from "next/navigation";

// Sign-up is handled from the /welcome splash (Clerk <SignIn/> exposes the
// sign-up flow). This route forwards there for any direct hits.
export default function SignUpPage() {
  redirect("/welcome");
}
