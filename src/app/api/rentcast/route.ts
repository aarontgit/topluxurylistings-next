export async function POST(req: Request) {
    const { address } = await req.json();
  
    const res = await fetch(
      `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Key": process.env.RENTCAST_API_KEY!,
        },
      }
    );
  
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  