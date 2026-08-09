import { atom } from "jotai";

interface Auth {
  email: string;
  role: string;
  department?: string;
  program?: string;
  academic_year?: string;
  resource?: true;
}
export const authAtom = atom<Auth | null>(null);

// Route guards need to tell "the whoami call has not come back yet" apart from
// "this user is not signed in" (T-13). Without this they both look like
// `authAtom === null`, and a guard would bounce every legitimate user to the
// login page during the first render.
export type AuthStatus = "loading" | "authenticated" | "anonymous";
export const authStatusAtom = atom<AuthStatus>("loading");
