import Link from "next/link";
import { CouchIcon } from "@/components/svgs";

export default function NotFound() {
  return (
    <main className="min-h-screen grain relative bg-bg flex flex-col items-center justify-center text-center px-10">
      <CouchIcon
        style={{
          position: "absolute",
          width: 520,
          left: "50%",
          top: "58%",
          transform: "translate(-50%,-50%)",
          color: "var(--accent)",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div className="relative">
        <div className="font-marker text-accent text-[96px] leading-none">
          404
        </div>
        <p className="font-marker text-fg text-[30px] mt-2">
          It&apos;s like… not happening.
        </p>
        <p className="font-sans text-[15px] text-muted mt-3 max-w-[400px]">
          This page took a break and never came back.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 font-sans font-semibold text-white bg-accent rounded-full px-7 py-3 text-[15px] shadow-[0_8px_20px_-8px_rgba(234,88,12,0.7)]"
        >
          Back to Central Perk
        </Link>
      </div>
    </main>
  );
}
