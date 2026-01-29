import { useMemo } from "react";

type SloganRevealProps = {
  lines: string[];
  className?: string;
  /**
   * Delay between characters in ms.
   */
  staggerMs?: number;
};

export function SloganReveal({ lines, className, staggerMs = 42 }: SloganRevealProps) {
  const chars = useMemo(() => {
    const out: Array<{ kind: "char"; ch: string } | { kind: "br" }> = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      for (const ch of Array.from(line)) out.push({ kind: "char", ch });
      if (i !== lines.length - 1) out.push({ kind: "br" });
    }
    return out;
  }, [lines]);

  let charIndex = 0;
  return (
    <h1 className={className}>
      {chars.map((item, i) => {
        if (item.kind === "br") return <br key={`br-${i}`} />;
        const delay = charIndex++ * staggerMs;
        return (
          <span key={`ch-${i}`} className="lp-slogan-char" style={{ animationDelay: `${delay}ms` }}>
            {item.ch}
          </span>
        );
      })}
    </h1>
  );
}

