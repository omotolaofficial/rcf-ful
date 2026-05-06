import { signInWithPopup } from "firebase/auth";
import { auth, authReady, googleAuthProvider } from "./lib/firebase";

export default function Login() {
  const signIn = async () => {
    try {
      await authReady;
      const result = await signInWithPopup(auth, googleAuthProvider);
      console.log(result.user);
      alert("Login successful");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={signIn}>
      Sign in with Google
    </button>
  );
}