import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function ensureUserDocument() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) return;

  const userRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      email: currentUser.email,
      tier: "free",
    });
  }
}
