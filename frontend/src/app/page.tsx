const features = [
  {
    title: "Real-time Price Signals",
    description: "Track product URLs and get notified when your target price is reached.",
  },
  {
    title: "Automated Checks",
    description: "Background workers check prices regularly so you never miss a deal.",
  },
  {
    title: "History Dashboard",
    description: "Visualize price movement over time and understand buying trends.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#DEF7EC_0%,#F7FAFC_35%,#E6FFFA_100%)] px-6 py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <section className="rounded-3xl border border-emerald-200 bg-white/80 p-8 shadow-xl backdrop-blur">
          <p className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            PricePulse MVP
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Buy Smarter With Automated Price Tracking
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            Save products, set target prices, and get notified instantly when prices drop.
            Designed for fast decision-making, built for deal hunters.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Create Account
            </a>
            <a
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
