// scripts/backfillFirestoreNumericFields.ts

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { firebaseConfig } from '../src/lib/firebase.js'; // ⬅️ notice the `.js` extension!

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const parseNum = (val: string) =>
  Number(val?.replace(/[^\d.]/g, '')) || 0;

async function backfillNumericFields() {
  const snapshot = await getDocs(collection(db, 'public_listings'));

  const updates = snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();

    const PriceNum = parseNum(data.Price);
    const BedsNum = parseNum(data.Beds);
    const BathsNum = parseNum(data.Baths);
    const SqFtNum = parseNum(data.SqFt);

    console.log(`Updating ${docSnap.id}`, { PriceNum, BedsNum, BathsNum, SqFtNum });

    return updateDoc(doc(db, 'public_listings', docSnap.id), {
      PriceNum,
      BedsNum,
      BathsNum,
      SqFtNum,
    });
  });

  await Promise.all(updates);
  console.log('✅ Numeric fields backfilled successfully.');
}

backfillNumericFields();
