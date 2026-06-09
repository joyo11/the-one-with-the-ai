import { LandingHero } from "@/components/landing-hero";
import { LandingPicker } from "@/components/landing-picker";
import { LandingActions } from "@/components/landing-actions";
import { HowItWorks } from "@/components/how-it-works";

/** Landing page — Central Perk hero → picker → actions → how it works → footer. */
export default function HomePage() {
  return (
    <main>
      <LandingHero />
      <LandingPicker />
      <LandingActions />
      <HowItWorks />
      <footer
        id="about"
        className="px-14 py-10 text-center font-mono text-[12px] text-muted border-t border-border bg-bg"
      >
        Educational, non-commercial fan project. Friends™ is owned by Warner
        Bros. Built with Claude.
      </footer>
    </main>
  );
}
