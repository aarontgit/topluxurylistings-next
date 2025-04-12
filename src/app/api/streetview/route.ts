import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const apiKey = process.env.STREETVIEW_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Street View API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}