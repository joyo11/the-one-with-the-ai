import { LandingHero } from "@/components/landing-hero";
import { LandingPicker } from "@/components/landing-picker";

/** Landing page — Central Perk hero + character picker + game CTA. */
export default function HomePage() {
  return (
    <main>
      <LandingHero />
      <LandingPicker />
      <footer
        id="about"
        className="px-14 py-10 text-center font-mono text-[12px] text-muted border-t border-border"
      >
        Educational, non-commercial fan project. Friends™ is owned by Warner
        Bros. Built with Claude.
      </footer>
    </main>
  );
}
