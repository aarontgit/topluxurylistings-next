import { adminDb, adminAuth } from '../../../lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';



export async function POST(req: NextRequest) {
  try {
    const { idToken, address } = await req.json();

    if (!idToken || !address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid input' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set(
      {
        inquiries: FieldValue.arrayUnion({
          address,
          timestamp: new Date().toISOString(),
        }),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('🔥 /api/inquire error:', err.message, err.stack);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }  
}
