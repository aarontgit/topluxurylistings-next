import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { Handshake, Home, Hammer } from "lucide-react";
import Link from "next/link"; // ✅ already present

export default function SellPage() {
  return (
    <>
      <NavBar />
      <div className="bg-white text-gray-900">
        <section
          className="relative h-[60vh] bg-cover bg-center flex items-center justify-center px-6 text-center text-white pt-24 sm:pt-0"
          style={{ backgroundImage: "url('/hero2.png')" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-3xl mx-auto p-8">
            <h1 className="text-2xl sm:text-4xl font-bold mb-4">Sell your home with confidence</h1>
            <p className="text-base sm:text-lg mb-6">
              Whether you work with an agent or take another approach, we’ll help you navigate the
              process and get the most out of your sale.
            </p>
            {/* ✅ link to valuation */}
            <Link
              href="/valuation"
              className="inline-block bg-gold-500 text-black px-6 py-3 rounded hover:bg-gold-400 transition font-semibold"
            >
              Get your home value estimate
            </Link>
          </div>
        </section>

        <section className="py-16 px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold mb-10 text-center">Ways to sell your home</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
              <Handshake className="w-10 h-10 mx-auto mb-4 text-gold-500" />
              <h3 className="text-xl font-bold mb-2">Work with an agent</h3>
              <p className="text-gray-700 mb-4">
                Find the right agent to sell your home for the best price.
              </p>
              {/* ✅ goes to Contact page */}
              <Link href="/contact" className="text-blue-600 font-medium hover:underline">
                Find an agent
              </Link>
            </div>

            {/* Card 2 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
              <Home className="w-10 h-10 mx-auto mb-4 text-gold-500" />
              <h3 className="text-xl font-bold mb-2">List it yourself</h3>
              <p className="text-gray-700 mb-4">
                Explore options for selling your home without an agent.
              </p>
              {/* ✅ now scrolls to article */}
              <a href="#selling-guide" className="text-blue-600 font-medium hover:underline">
                Learn more
              </a>
            </div>

            {/* Card 3 */}
            <div className="p-6 border rounded-lg shadow-sm text-center">
              <Hammer className="w-10 h-10 mx-auto mb-4 text-gold-500" />
              <h3 className="text-xl font-bold mb-2">Get help prepping your home</h3>
              <p className="text-gray-700 mb-4">
                We can connect you with trusted professionals for repairs, staging, and cleaning.
              </p>
              {/* ✅ goes to Contact with interest preselected */}
              <Link href="/contact?interest=prep" className="text-blue-600 font-medium hover:underline">
                Explore services
              </Link>
            </div>
          </div>
        </section>

        {/* 🔵 Blue divider (between cards and article) */}
        <section aria-hidden="true" className="px-6">
          <div className="max-w-6xl mx-auto my-4">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow" />
          </div>
        </section>

        {/* ---------- Article Section ---------- */}
        <section
          id="selling-guide"
          className="py-16 px-6 max-w-3xl mx-auto"
          style={{ scrollMarginTop: "calc(var(--navbar-height) + 8px)" }} // ✅ added offset
        >
          <h2 className="text-3xl font-bold mb-6">Selling Your House (Without Losing Your Mind): A Practical Guide</h2>
          <p className="mb-6">
            Thinking about selling? Here’s the stuff that actually moves the needle—what to do, what to skip,
            and how to keep your sanity from “Let’s list it” to “We’re closed!”
          </p>

          <h3 className="text-2xl font-semibold mt-10 mb-3">1) Choose your path: Agent or DIY (FSBO)?</h3>
          <p className="mb-2 font-medium">Work with an agent if you want:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Pricing expertise and negotiating power</li>
            <li>MLS exposure, pro photos, and scheduling handled</li>
            <li>Someone to quarterback deadlines, disclosures, and problems</li>
          </ul>
          <p className="mb-2 font-medium">Go FSBO if you want:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>To save listing commission (you may still offer buyer’s agent commission)</li>
            <li>Direct control over showings and negotiations</li>
            <li>To learn a lot very fast</li>
          </ul>
          <p className="mb-6">
            Tip: Even FSBO sellers often hire a flat-fee MLS service and a real estate attorney for contract
            review. It’s a solid middle ground.
          </p>

          <h3 className="text-2xl font-semibold mt-10 mb-3">2) Timing matters</h3>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Seasonality:</strong> Late spring → early summer usually draws the largest buyer pool.</li>
            <li><strong>Local market speed:</strong> If days on market are low, be ready to move quickly.</li>
            <li><strong>Your life:</strong> You’ll need flexibility for showings and repairs; plan around work/travel.</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">3) Price it right</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Start with comps from the last 3–6 months: same neighborhood, size, style, condition.</li>
            <li>Adjust for condition: fresh paint &amp; floors help; dated kitchens/baths can drag.</li>
            <li>
              Pick a strategy:
              <ul className="list-disc pl-6 mt-2">
                <li><em>Market-value</em>: strong traffic &fair offers</li>
                <li><em>Slightly under</em>: can spark a bidding war in hot areas</li>
                <li><em>Aspirational</em>: risky—often leads to price cuts and stale days</li>
              </ul>
            </li>
          </ul>
          <p className="mb-6"><strong>Gut check:</strong> No 5–10 showings in week one? Adjust price or presentation.</p>

          <h3 className="text-2xl font-semibold mt-10 mb-3">4) Prep the home (high-ROI fixes only)</h3>
          <p className="mb-2 font-medium">Weekend wins</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Deep clean, declutter 30–40%, neutralize odors</li>
            <li>Touch-up paint, fix drips &amp; squeaks</li>
            <li>New LED bulbs, matched color temps, clean windows</li>
            <li>Curb appeal: mulch, edged lawn, planters, power wash</li>
          </ul>
          <p className="mb-2 font-medium">Optional upgrades</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Refinish worn hardwoods or replace destroyed carpet</li>
            <li>Swap dated lighting &amp; cabinet hardware</li>
            <li>Avoid full remodels unless comps demand it</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">5) Disclosures &amp; docs</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Seller’s Property Disclosure, lead-based paint (pre-1978), HOA docs if applicable</li>
            <li>Permits, warranties, survey, and recent utility bills help buyers feel confident</li>
            <li><em>Colorado note:</em> Common forms include Seller’s Property Disclosure, Square Footage
              Disclosure, Source of Water Addendum, and the Contract to Buy and Sell (verify locally)</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">6) Photos &amp; listing copy</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Hire a pro photographer; add a floor plan if possible</li>
            <li>Lead image: best exterior or showpiece room</li>
            <li>Copy: hook sentence + bullet the facts and upgrades</li>
            <li>Avoid 40 repetitive photos—curate 20–30 strong shots</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">7) Marketing &amp; showings</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>MLS distribution pushes to major sites automatically</li>
            <li>Use a lockbox, remove valuables, set clear showing windows</li>
            <li>Keep it “hotel clean” for the first 7–10 days—your prime window</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">8) Offers: look beyond the price</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Financing strength and appraisal gap coverage</li>
            <li>Inspection terms, concessions, deadlines &amp; possession</li>
            <li>A clean, fast, low-risk offer can beat a slightly higher but messy one</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">9) Under contract: keep momentum</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Offer credits vs. juggling repairs where possible</li>
            <li>Appraisal low? Negotiate price, split, or gap coverage</li>
            <li>Respond quickly to title/escrow requests; keep utilities active</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">10) Closing day checklist</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>IDs, keys/remotes, mailbox keys, access codes</li>
            <li>Final meter readings, warranties, appliance manuals</li>
            <li>Clean, empty house; forwarding address set</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">11) What will I net?</h3>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Agented:</strong> ~6–8% all-in typical (market dependent)</li>
            <li><strong>FSBO:</strong> ~1–3% (buyer’s agent + fees)</li>
            <li>Ask your title company for a preliminary net sheet</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">12) Pitfalls to avoid</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Overpricing “to test the market”</li>
            <li>Hiding known issues</li>
            <li>Dark photos, clutter, weak copy</li>
            <li>Missing deadlines under contract</li>
            <li>Letting emotions drive negotiations</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-10 mb-3">13) A simple timeline</h3>
          <ol className="list-decimal pl-6 mb-6">
            <li>Weeks 1–2: Declutter, small fixes, paint, curb appeal</li>
            <li>Week 3: Photos + list</li>
            <li>Days 1–10: Heavy showings, feedback, offers/counters</li>
            <li>30–45 days under contract: Inspection, appraisal, loan/title</li>
            <li>Closing day: Keys, funds, done</li>
          </ol>

          <div className="mt-10 grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">Prep Sprint</h4>
              <ul className="list-disc pl-6">
                <li>Deep clean + declutter</li>
                <li>Touch-up paint + bulbs</li>
                <li>Minor fixes</li>
                <li>Curb appeal refresh</li>
                <li>Stage key rooms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Listing Essentials</h4>
              <ul className="list-disc pl-6">
                <li>Pro photos + floor plan</li>
                <li>Comp-based price</li>
                <li>Strong first paragraph + bullets</li>
                <li>Disclosures ready</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Under Contract</h4>
              <ul className="list-disc pl-6">
                <li>Inspection response plan</li>
                <li>Appraisal strategy</li>
                <li>Title/HOA docs returned fast</li>
                <li>Utilities through closing</li>
              </ul>
            </div>
          </div>

          <p className="mt-8">
            Want help pricing or a second set of eyes on your plan?
            <Link href="/contact" className="text-blue-600 hover:underline ml-1">
              Reach out—happy to help.
            </Link>
          </p>
        </section>

        <Footer />
      </div>
    </>
  );
}
