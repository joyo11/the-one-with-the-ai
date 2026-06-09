/** Three-step elevator pitch — what new visitors need before they engage. */
export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Pick a friend",
      body: "Six characters, all grounded in every line they ever said on the show.",
    },
    {
      n: "02",
      title: "Talk like you're in the apartment",
      body: "They'll match the voice, the rhythm, the jokes — and they know what's happening this week.",
    },
    {
      n: "03",
      title: "Come back. They'll remember you.",
      body: "Memory across sessions. Sometimes they'll text you first when something's on their mind.",
    },
  ];

  return (
    <section className="bg-surface border-t border-border px-5 sm:px-10 lg:px-14 py-14 sm:py-20">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-marker text-accent text-[20px] sm:text-[24px] text-center mb-1">
          how this works
        </p>
        <h2 className="font-marker text-fg text-[30px] sm:text-[40px] text-center leading-tight mb-12">
          Three friends-style steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 relative">
              <p
                className="font-marker text-accent text-[64px] leading-none"
                style={{ textShadow: "2px 3px 0 rgba(234,88,12,.12)" }}
              >
                {s.n}
              </p>
              <p className="font-marker text-fg text-[22px] leading-tight">
                {s.title}
              </p>
              <p className="text-[14px] text-muted leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
