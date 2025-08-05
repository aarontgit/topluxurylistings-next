import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
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
  
  function shuffleArray<T>(array: T[]): T[] {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }
  
  export async function getPublicListings({
    minPrice,
    maxPrice,
    beds,
    exactBeds,
    baths,
    cities,
    county,
    zip,
    orderField,
    orderDirection,
    pageSize = 40,
    cursor = null,
  }: {
    minPrice?: number;
    maxPrice?: number;
    beds?: number;
    exactBeds?: boolean;
    baths?: number;
    cities?: string[];
    county?: string;
    zip?: string;
    citySearch?: string;
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
  
    console.log("🔍 getPublicListings called with:", {
      minPrice,
      maxPrice,
      beds,
      exactBeds,
      baths,
      cities,
      county,
      zip,
      orderField,
      orderDirection,
      pageSize,
      cursor,
    });
  
    let zipFallback = null;
  
    if (zip) {
      constraints.push(where("ZipCode", "==", zip));
    } else {
      if (cities && cities.length > 0) {
        constraints.push(where("City", "in", cities.slice(0, 10)));
      }
      if (county) {
        constraints.push(where("County", "==", county));
      }
    }
  
    const shouldOrder = !!orderField && !!orderDirection;
    if (shouldOrder) {
      constraints.push(orderBy(orderField, orderDirection));
    }
  
    if (cursor) {
      constraints.push(startAfter(cursor));
    }
  
    const fetchSize = shouldOrder ? pageSize : 120;
    constraints.push(limit(fetchSize));
  
    let q = query(listingsRef, ...constraints);
    let snapshot = await getDocs(q);
  
    console.log("📦 Initial Firestore snapshot returned:", snapshot.size);
    console.log("📦 First doc ZIPCode:", snapshot.docs[0]?.data()?.ZipCode);
  
    if (snapshot.empty && zip) {
      const zipRef = doc(db, "zip_geo", zip);
      const zipSnap = await getDoc(zipRef);
      const originalEntry = zipSnap.exists() ? zipSnap.data() : null;
  
      if (originalEntry) {
        const originalLat = originalEntry.lat;
        const originalLng = originalEntry.lng;
  
        const allZipsSnap = await getDocs(collection(db, "zip_geo"));
        const allZips = allZipsSnap.docs.map((d) => d.data());
  
        let closest = null;
        let closestDist = Infinity;
  
        for (const entry of allZips) {
          if (entry.zip.toString() === zip) continue;
          const dist = Math.sqrt(
            Math.pow(entry.lat - originalLat, 2) +
            Math.pow(entry.lng - originalLng, 2)
          );
          if (dist < closestDist) {
            closest = entry;
            closestDist = dist;
          }
        }
  
        if (closest) {
          zipFallback = {
            originalZip: zip,
            fallbackZip: closest.zip.toString(),
            fallbackCity: closest.city,
            fallbackCounty: closest.county_names_all,
          };
  
          const fallbackConstraints: any[] = [];
  
          if (minPrice !== undefined) {
            fallbackConstraints.push(where("PriceNum", ">=", minPrice));
          }
          if (maxPrice !== undefined) {
            fallbackConstraints.push(where("PriceNum", "<=", maxPrice));
          }
          if (beds !== undefined) {
            fallbackConstraints.push(
              exactBeds ? where("BedsNum", "==", beds) : where("BedsNum", ">=", beds)
            );
          }
          if (baths !== undefined) {
            fallbackConstraints.push(where("BathsNum", ">=", baths));
          }
  
          fallbackConstraints.push(where("ZipCode", "==", closest.zip.toString()));
          if (shouldOrder) {
            fallbackConstraints.push(orderBy(orderField, orderDirection));
          }
          if (cursor) {
            fallbackConstraints.push(startAfter(cursor));
          }
          fallbackConstraints.push(limit(fetchSize));
  
          q = query(listingsRef, ...fallbackConstraints);
          snapshot = await getDocs(q);
  
          console.log("📦 Fallback Firestore snapshot returned:", snapshot.size);
          console.log("📦 Fallback ZIP used:", closest.zip);
        }
      }
    }
  
    let listings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  
    if (!shouldOrder) {
      listings = shuffleArray(listings).slice(0, pageSize);
    }
  
    return {
      listings,
      nextPageCursor: snapshot.docs[snapshot.docs.length - 1] || null,
      zipFallback,
    };
  }
  
  export async function getRecommendedListings(city: string) {
    try {
      const listingsRef = collection(db, "public_listings");
  
      let q = query(
        listingsRef,
        where("City", "==", city),
        orderBy("PriceNum", "desc"),
        limit(6)
      );
  
      let snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        q = query(
          listingsRef,
          where("City", "==", "Denver"),
          orderBy("PriceNum", "desc"),
          limit(6)
        );
        snapshot = await getDocs(q);
      }
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching recommended listings:", error);
      return [];
    }
  }
  