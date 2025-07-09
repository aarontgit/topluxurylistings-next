import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, GeoPoint } from "firebase-admin/firestore";

// Types
type ListingData = {
  id: string;
  PriceNum: number;
  BedsNum: number;
  BathsNum: number;
  City: string;
  County: string;
  ZipCode?: string;
  GeoPoint?: GeoPoint;
  [key: string]: any;
};

type ZipGeoEntry = {
  zip: string | number;
  lat: number;
  lng: number;
  city: string;
  county_names_all: string;
};

// Firebase setup
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    citySearch,
    cityOverride,
    minPrice,
    maxPrice,
    beds,
    exactBeds,
    baths,
    cities,
    county,
    zip,
    cursor,
  } = body;

  console.log("📬 searchNearby received:", {
    citySearch,
    zip,
    cityOverride,
    county,
  });
  

  const pageSize = 40;
  let addressMatch: ListingData | null = null;
  let zipToUse: string | null = zip ?? null;

  try {
    if (citySearch) {
      const addressSnap = await db
        .collection("public_listings")
        .where("Address", "==", citySearch.trim())
        .limit(1)
        .get();

      if (!addressSnap.empty) {
        const matchDoc = addressSnap.docs[0];
        const data = matchDoc.data() as Partial<ListingData>;

        addressMatch = {
          ...data,
          id: matchDoc.id,
          PriceNum: data.PriceNum ?? 0,
          BedsNum: data.BedsNum ?? 0,
          BathsNum: data.BathsNum ?? 0,
          City: data.City ?? "",
          County: data.County ?? "",
        };

        if (addressMatch.ZipCode) {
          zipToUse = addressMatch.ZipCode;
        }
      } else {
        const zipGuess = citySearch.match(/\b\d{5}\b/);
        if (zipGuess) zipToUse = zipGuess[0];
      }
    }

    let query = db.collection("public_listings").orderBy("PriceNum", "desc");

    if (zipToUse) {
        query = query.where("ZipCode", "==", zipToUse);
      } else if (cityOverride) {
        query = query.where("City", "==", cityOverride);
      }
      
    if (minPrice !== undefined) {
      query = query.where("PriceNum", ">=", minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.where("PriceNum", "<=", maxPrice);
    }
    if (cursor !== null && cursor !== undefined) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.limit(pageSize).get();
    let listings = snapshot.docs
      .map((doc) => {
        const data = doc.data() as ListingData;
        if (beds !== undefined && (exactBeds ? data.BedsNum !== beds : data.BedsNum < beds)) return null;
        if (baths !== undefined && data.BathsNum < baths) return null;
        if (cities && cities.length && !cities.includes(data.City)) return null;
        if (county && data.County !== county) return null;
        if (zipToUse && data.ZipCode !== zipToUse) return null;
        return {
          ...data,
          id: doc.id,
        };
      })
      .filter(Boolean);

    if (addressMatch !== null) {
      const match = addressMatch;
      listings = [
        match,
        ...listings.filter((l): l is ListingData => l !== null && l.id !== match.id),
      ];
    }

    if (listings.length > 0 || !zipToUse) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextPageCursor = lastDoc ? lastDoc.get("PriceNum") : null;
      return NextResponse.json({ listings, nextPageCursor });
    }

    const zipDoc = await db.collection("zip_geo").doc(zipToUse!).get();
    if (!zipDoc.exists) {
      return NextResponse.json({ listings: [], nextPageCursor: null });
    }

    const zipMatch = zipDoc.data() as ZipGeoEntry;
    const nearbySnap = await db.collection("zip_geo").get();
    const zipGeoData: ZipGeoEntry[] = nearbySnap.docs.map((doc) => doc.data() as ZipGeoEntry);

    const fallbackZips = zipGeoData
      .map((z) => ({
        ...z,
        distance: Math.sqrt(Math.pow(z.lat - zipMatch.lat, 2) + Math.pow(z.lng - zipMatch.lng, 2)),
      }))
      .sort((a, b) => a.distance - b.distance);

    for (const z of fallbackZips) {
      if (z.zip.toString() === zipToUse) continue;

      const altQuery = db
        .collection("public_listings")
        .where("ZipCode", "==", z.zip.toString())
        .orderBy("PriceNum", "desc")
        .limit(pageSize);

      const altSnap = await altQuery.get();
      const altListings = altSnap.docs
        .map((doc) => {
          const data = doc.data() as ListingData;
          if (beds !== undefined && (exactBeds ? data.BedsNum !== beds : data.BedsNum < beds)) return null;
          if (baths !== undefined && data.BathsNum < baths) return null;
          if (cities && cities.length && !cities.includes(data.City)) return null;
          if (county && data.County !== county) return null;
          return {
            ...data,
            id: doc.id,
          };
        })
        .filter(Boolean);

      if (altListings.length > 0) {
        return NextResponse.json({
          listings: altListings,
          nextPageCursor: altSnap.docs[altSnap.docs.length - 1]?.get("PriceNum") ?? null,
          zipFallback: {
            from: zipToUse,
            to: z.zip,
            distanceMiles: (z.distance * 69).toFixed(1),
            city: z.city,
            county: z.county_names_all.split("|")[0],
          },
        });
      }
    }

    return NextResponse.json({ listings: [], nextPageCursor: null });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
