import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../../lib/firebaseAdmin";

// POST /api/increment-valuation
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Verify token and extract user ID
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.data();
    const currentCount = userData?.valuationCount ?? 0;
    const tier = userData?.tier ?? "free";

    if (tier !== "admin" && currentCount >= 3) {
      return NextResponse.json({ error: "Valuation limit reached" }, { status: 403 });
    }

    await userRef.update({ valuationCount: currentCount + 1 });

    return NextResponse.json({ success: true, newCount: currentCount + 1 });
  } catch (err) {
    console.error("Error in /api/increment-valuation:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
