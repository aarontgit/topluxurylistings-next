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
    exactBeds,
    baths,
    cities,
    county,
    orderField = "PriceNum",
    orderDirection = "asc",
    pageSize = 40,
    cursor = null,
  }: {
    minPrice?: number;
    maxPrice?: number;
    beds?: number;
    exactBeds?: boolean;
    baths?: number;
    cities?: string[]; // 🛠️ was city?: string -> now cities?: string[]
    county?: string;
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
        constraints.push(
          exactBeds ? where("BedsNum", "==", beds) : where("BedsNum", ">=", beds)
        );
      }
  
    if (baths !== undefined) {
      constraints.push(where("BathsNum", ">=", baths));
    }

    if (cities && cities.length > 0) {
        constraints.push(where("City", "in", cities.slice(0, 10))); 
        // 🛠️ Firestore only allows max 10 values in 'in' query
    }

    if (county) {
        constraints.push(where("County", "==", county));
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
  