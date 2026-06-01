"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchGameRound, type GameRound } from "@/lib/api";
import { BY_NAME, CHARACTERS, type CharacterName } from "@/lib/characters";
import { CharacterMarker } from "@/components/character-marker";
import { CouchIcon } from "@/components/svgs";

type Phase = "start" | "loading" | "round" | "reveal" | "end";

const TOTAL_ROUNDS = 10;

export function GamePage() {
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState<GameRound | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [picked, setPicked] = useState<CharacterName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRound = useCallback(async () => {
    setPhase("loading");
    setPicked(null);
    setError(null);
    try {
      const r = await fetchGameRound();
      setRound(r);
      setRoundNum((n) => n + 1);
      setPhase("round");
    } catch (e) {
      setError("Couldn't load a round. Is the backend running?");
      setPhase("start");
    }
  }, []);

  const startGame = useCallback(() => {
    setRoundNum(0);
    setUserScore(0);
    setAiScore(0);
    loadRound();
  }, [loadRound]);

  const pick = useCallback(
    (name: CharacterName) => {
      if (!round || picked) return;
      setPicked(name);
      const userCorrect = name === round.answer;
      const aiCorrect = round.classifier_pred === round.answer;
      if (userCorrect) setUserScore((s) => s + 1);
      if (aiCorrect) setAiScore((s) => s + 1);
      setPhase("reveal");
    },
    [round, picked],
  );

  const next = useCallback(() => {
    if (roundNum >= TOTAL_ROUNDS) {
      setPhase("end");
    } else {
      loadRound();
    }
  }, [roundNum, loadRound]);

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* slim header */}
      <header
        className="flex items-center gap-3 px-6 py-4 bg-surface"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/"
          className="text-muted text-[20px] leading-none px-1"
          aria-label="Back"
        >
          ‹
        </Link>
        <span className="font-marker text-fg text-[20px] flex items-center">
          F<span style={{ color: "#F87171" }}>•</span>R
          <span style={{ color: "#60A5FA" }}>•</span>I
          <span style={{ color: "#FBBF24" }}>•</span>E
          <span style={{ color: "#F87171" }}>•</span>N
          <span style={{ color: "#60A5FA" }}>•</span>D
          <span style={{ color: "#FBBF24" }}>•</span>S
        </span>
        <span className="ml-auto font-mono text-[13px] text-muted">
          {phase === "round" || phase === "reveal" ? (
            <>
              Round <b className="text-fg">{roundNum}</b> / {TOTAL_ROUNDS}
            </>
          ) : phase === "end" ? (
            <>Score</>
          ) : null}
        </span>
        {(phase === "round" || phase === "reveal") && (
          <span className="font-sans font-semibold text-[13px] text-accent ml-3">
            Score {userScore} / {roundNum - (phase === "round" ? 1 : 0)} ✓
          </span>
        )}
      </header>

      {/* phases */}
      <div className="flex-1 grain relative bg-bg flex flex-col items-center justify-center px-6 py-10">
        {phase === "start" && <StartCard onStart={startGame} error={error} />}
        {phase === "loading" && <LoadingCard />}
        {phase === "round" && round && <RoundCard round={round} onPick={pick} />}
        {phase === "reveal" && round && picked && (
          <RevealCard
            round={round}
            picked={picked}
            onNext={next}
            isLast={roundNum >= TOTAL_ROUNDS}
          />
        )}
        {phase === "end" && (
          <EndCard
            user={userScore}
            ai={aiScore}
            onReplay={startGame}
          />
        )}
      </div>
    </main>
  );
}

function StartCard({
  onStart,
  error,
}: {
  onStart: () => void;
  error: string | null;
}) {
  return (
    <div className="text-center max-w-[560px] relative">
      <CouchIcon
        style={{
          position: "absolute",
          width: 520,
          left: "50%",
          top: "62%",
          transform: "translate(-50%,-50%)",
          color: "var(--accent)",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <span className="relative inline-block font-sans font-semibold text-[12px] tracking-wider uppercase text-accent bg-bg border border-border rounded-full px-3 py-1 mb-5">
        Score 0 / {TOTAL_ROUNDS}
      </span>
      <h1 className="relative font-marker text-fg text-[56px] leading-[0.95]">
        Guess Who Said It
      </h1>
      <p className="relative font-sans text-[17px] text-muted leading-relaxed mt-5">
        We show you a real line from the show. You pick who said it. Then our
        AI classifier makes <i>its</i> guess — see if you can beat the machine.
      </p>
      {error && (
        <p className="relative font-sans text-[13px] text-error mt-4">{error}</p>
      )}
      <div className="relative mt-8 flex items-center justify-center gap-3">
        <button
          onClick={onStart}
          className="font-sans font-semibold text-white bg-accent rounded-full px-8 py-3.5 text-[16px] shadow-[0_8px_20px_-8px_rgba(234,88,12,0.7)] active:scale-[0.97] transition-transform"
        >
          Start round →
        </button>
        <Link
          href="/"
          className="font-sans font-semibold text-fg border border-border rounded-full px-7 py-3.5 text-[16px] hover:bg-accent hover:text-white hover:border-accent transition-colors"
        >
          Back to friends
        </Link>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="text-center max-w-[560px]">
      <div className="skeleton mx-auto" style={{ width: 80, height: 80, borderRadius: 9999 }} />
      <div className="skeleton mx-auto mt-6" style={{ width: 360, height: 24 }} />
      <div className="skeleton mx-auto mt-3" style={{ width: 280, height: 24 }} />
    </div>
  );
}

function RoundCard({
  round,
  onPick,
}: {
  round: GameRound;
  onPick: (name: CharacterName) => void;
}) {
  return (
    <div className="text-center max-w-[860px] w-full">
      <p className="font-sans text-[14px] text-muted uppercase tracking-wider mb-6">
        Who said this?
      </p>
      <blockquote
        className="font-marker text-fg leading-[1.05] text-[44px] sm:text-[52px] max-w-[760px] mx-auto"
        style={{ textWrap: "balance" as never }}
      >
        “{round.line}”
      </blockquote>
      <div className="flex flex-wrap justify-center gap-3 mt-12 max-w-[640px] mx-auto">
        {round.options.map((name) => {
          const c = BY_NAME[name];
          if (!c) return null;
          return (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="inline-flex items-center gap-2 rounded-full bg-bg border border-border px-3.5 py-2 font-sans font-semibold text-[14px] text-fg hover:border-accent hover:-translate-y-[1px] transition-all"
            >
              <CharacterMarker character={c} size={28} />
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RevealCard({
  round,
  picked,
  onNext,
  isLast,
}: {
  round: GameRound;
  picked: CharacterName;
  onNext: () => void;
  isLast: boolean;
}) {
  const userCorrect = picked === round.answer;
  const aiCorrect = round.classifier_pred === round.answer;
  const truth = BY_NAME[round.answer]!;
  const conf = Math.round(round.classifier_confidence * 100);
  return (
    <div className="text-center max-w-[680px] w-full">
      <span
        className="animate-pop inline-flex items-center gap-2 font-sans font-bold text-[15px] text-white rounded-full px-5 py-2"
        style={{ background: userCorrect ? "var(--success)" : "var(--error)" }}
      >
        {userCorrect ? "✓ Correct!" : "✕ Not quite"}
      </span>
      <blockquote className="font-marker text-fg leading-[1.05] text-[34px] sm:text-[40px] max-w-[680px] mx-auto mt-7">
        “{round.line}”
      </blockquote>
      <div className="flex items-center justify-center gap-4 mt-8">
        <CharacterMarker character={truth} size={80} />
        <div className="text-left">
          <div className="flex items-center gap-2">
            <CouchIcon style={{ width: 22, color: "var(--accent)" }} />
            <p className="font-sans font-bold text-[22px] text-fg">
              {truth.name}
            </p>
          </div>
          <p className="font-sans text-[14px] text-muted">
            {userCorrect ? (
              <>Your pick: {truth.name} — nailed it.</>
            ) : (
              <>
                You said{" "}
                <span className="text-fg font-semibold">{picked}</span> · it
                was <span className="text-fg font-semibold">{truth.name}</span>.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-9 w-[440px] max-w-full mx-auto text-left">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[12px] text-muted">
            AI classifier guessed{" "}
            <b className="text-fg">{round.classifier_pred}</b>
          </span>
          <span className="font-mono text-[12px] text-fg">{conf}%</span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="animate-bar-fill h-full rounded-full"
            style={{
              width: `${conf}%`,
              background: aiCorrect ? "var(--success)" : "var(--error)",
            }}
          />
        </div>
        {!aiCorrect && (
          <p className="font-mono text-[11px] text-muted mt-2">
            The AI got this one wrong too.
          </p>
        )}
      </div>
      <button
        onClick={onNext}
        className="mt-9 font-sans font-semibold text-white bg-accent rounded-full px-8 py-3 text-[15px] shadow-[0_8px_20px_-8px_rgba(234,88,12,0.7)] active:scale-[0.97] transition-transform"
      >
        {isLast ? "See final score →" : "Next line →"}
      </button>
    </div>
  );
}

function EndCard({
  user,
  ai,
  onReplay,
}: {
  user: number;
  ai: number;
  onReplay: () => void;
}) {
  const beatAI = user > ai;
  const tied = user === ai;
  return (
    <div className="text-center relative">
      <CouchIcon
        style={{
          position: "absolute",
          width: 600,
          left: "50%",
          top: "60%",
          transform: "translate(-50%,-50%)",
          color: "var(--accent)",
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <p className="relative font-sans text-[15px] text-muted uppercase tracking-wider">
        You scored
      </p>
      <div className="relative font-marker text-accent leading-none text-[120px] mt-1">
        {user}/{TOTAL_ROUNDS}
      </div>
      <div className="relative mt-6 inline-flex items-stretch rounded-2xl border border-border overflow-hidden bg-surface">
        <div className="px-8 py-4 text-center">
          <p className="font-mono text-[12px] text-muted">You</p>
          <p className="font-marker text-fg text-[34px] leading-none mt-1">
            {user}
          </p>
        </div>
        <div className="w-px bg-border" />
        <div className="px-8 py-4 text-center">
          <p className="font-mono text-[12px] text-muted">The AI</p>
          <p className="font-marker text-muted text-[34px] leading-none mt-1">
            {ai}
          </p>
        </div>
      </div>
      <p
        className="relative font-marker text-[28px] mt-6"
        style={{ color: beatAI ? "var(--success)" : tied ? "var(--accent)" : "var(--muted)" }}
      >
        {beatAI ? "You beat the AI! 🏆" : tied ? "Tied with the AI." : "AI beat you this time."}
      </p>
      <div className="relative mt-8 flex items-center justify-center gap-3">
        <button
          onClick={onReplay}
          className="font-sans font-semibold text-white bg-accent rounded-full px-8 py-3.5 text-[16px] shadow-[0_8px_20px_-8px_rgba(234,88,12,0.7)] active:scale-[0.97] transition-transform"
        >
          Play again
        </button>
        <Link
          href="/"
          className="font-sans font-semibold text-fg border border-border rounded-full px-7 py-3.5 text-[16px] hover:bg-accent hover:text-white hover:border-accent transition-colors"
        >
          Back to friends
        </Link>
      </div>
    </div>
  );
}
