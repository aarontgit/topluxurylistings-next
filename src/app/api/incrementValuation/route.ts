// /app/api/incrementValuation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../../lib/firebaseAdmin"; // update path as needed

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();

    const data = snap.data();

    if (!snap.exists) {
      // Auto-create user doc
      await userRef.set({
        email,
        tier: "free",
        valuationCount: 1,
      });
      return NextResponse.json({ success: true });
    }

    const count = data?.valuationCount || 0;
    const tier = data?.tier || "free";

    if (tier !== "admin" && count >= 3) {
      return NextResponse.json({ error: "Valuation limit reached" }, { status: 403 });
    }

    await userRef.update({ valuationCount: count + 1 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Increment route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
