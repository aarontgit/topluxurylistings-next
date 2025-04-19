import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    DocumentData,
    QueryDocumentSnapshot,
  } from "firebase/firestore";
  import { app } from "./firebase";
  
  const db = getFirestore(app);
  
  export async function getPublicListings({
    minPrice,
    maxPrice,
    beds,
    baths,
    orderField = "PriceNum",
    orderDirection = "asc",
    pageSize = 40,
    cursor = null,
  }: {
    minPrice?: number;
    maxPrice?: number;
    beds?: number;
    baths?: number;
    orderField?: string;
    orderDirection?: "asc" | "desc";
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
  } = {}) {
    const listingsRef = collection(db, "public_listings");
  
    const constraints: any[] = [];
  
    if (minPrice !== undefined) {
      constraints.push(where("PriceNum", ">=", minPrice));
    }
  
    if (maxPrice !== undefined) {
      constraints.push(where("PriceNum", "<=", maxPrice));
    }
  
    if (beds !== undefined) {
      constraints.push(where("BedsNum", ">=", beds));
    }
  
    if (baths !== undefined) {
      constraints.push(where("BathsNum", ">=", baths));
    }
  
    constraints.push(orderBy(orderField, orderDirection));
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
    constraints.push(limit(pageSize));
  
    const q = query(listingsRef, ...constraints);
    const snapshot = await getDocs(q);
  
    return {
      listings: snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      nextPageCursor: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }
  