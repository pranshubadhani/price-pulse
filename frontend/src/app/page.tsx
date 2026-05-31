const features = [
  {
    id: "01.",
    title: "Real-time Price Signals",
    description: "Track product URLs and get notified when your target price is reached.",
  },
  {
    id: "02.",
    title: "Automated Checks",
    description: "Background workers check prices regularly so you never miss a deal.",
  },
  {
    id: "03.",
    title: "History Dashboard",
    description: "Visualize price movement over time and understand buying trends.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#171a1d]">
      <section className="relative overflow-hidden bg-[#111416] px-4 pb-16 pt-10 text-white sm:px-6 sm:pb-20 sm:pt-14">
        <div className="pp-hero-orb-a" />
        <div className="pp-hero-orb-b" />
        <div className="pp-hero-orb-c" />

        <div className="mx-auto grid w-full max-w-6xl gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-7">
            <p className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9ff3e]">
              Next Phase Live
            </p>
            <h1 className="pp-hero-title max-w-3xl text-white">
              Precision price tracking with a calm, high-end control surface.
            </h1>
            <p className="pp-hero-subtitle max-w-2xl text-white/78">
              Capture deals across supported stores, monitor movement, and act faster with a
              focused interface designed for clarity.
            </p>
            <div className="pp-hero-actions">
              <a href="/register" className="pp-split-pill">
                <span className="pp-split-pill-label">Create Account</span>
                <span className="pp-split-pill-dot">↗</span>
              </a>
              <a
                href="/login"
                className="inline-flex min-h-[2.7rem] w-full items-center justify-center rounded-full border border-white/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white/10 sm:w-auto"
              >
                Login
              </a>
            </div>
          </div>

          <div className="rounded-[1.65rem] border border-white/15 bg-white/5 p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9ff3e]">Supported Domains</p>
            <ul className="mt-6 space-y-4 text-sm text-white/86">
              <li className="flex items-center justify-between border-b border-white/15 pb-3">
                <span>Amazon</span>
                <span className="text-[#c9ff3e]">LIVE</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/15 pb-3">
                <span>Flipkart</span>
                <span className="text-[#c9ff3e]">LIVE</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/15 pb-3">
                <span>Myntra</span>
                <span className="text-[#c9ff3e]">LIVE</span>
              </li>
              <li className="flex items-center justify-between pb-1">
                <span>Ajio</span>
                <span className="text-[#c9ff3e]">LIVE</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <h2 className="text-2xl font-semibold text-[#171a1d] sm:text-3xl">How It Works</h2>
          <a href="/dashboard" className="pp-split-pill">
            <span className="pp-split-pill-label">Open Dashboard</span>
            <span className="pp-split-pill-dot">→</span>
          </a>
        </div>

        <section className="space-y-2">
          {features.map((feature) => (
            <details
              key={feature.title}
              className="group rounded-2xl border border-[#d8d6ce] bg-white px-4 py-4 transition sm:px-5"
              open
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-[#d8d6ce] pb-3 text-[#171a1d] sm:gap-4">
                <span className="text-2xl font-semibold leading-none text-[#b9b6ad] sm:text-3xl">{feature.id}</span>
                <span className="text-base font-semibold sm:text-lg">{feature.title}</span>
              </summary>
              <p className="pt-4 text-sm leading-7 text-[#3f4347]">{feature.description}</p>
            </details>
          ))}
        </section>
      </section>
    </main>
  );
}
