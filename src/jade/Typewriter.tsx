import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cx } from "./cx";

export interface TypewriterProps {
  words: string[];
  speed?: number;
  deleteSpeed?: number;
  pause?: number;
  loop?: boolean;
  className?: string;
}

export function Typewriter({
  words,
  speed = 70,
  deleteSpeed = 40,
  pause = 1200,
  loop = true,
  className,
}: TypewriterProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced || words.length === 0) return;
    const word = words[index % words.length] ?? "";

    if (!deleting && text === word) {
      if (!loop && index === words.length - 1) return;
      const timeout = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(timeout);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () =>
        setText((prev) =>
          deleting ? word.slice(0, Math.max(0, prev.length - 1)) : word.slice(0, prev.length + 1),
        ),
      deleting ? deleteSpeed : speed,
    );
    return () => clearTimeout(timeout);
  }, [text, deleting, index, words, speed, deleteSpeed, pause, loop, reduced]);

  const shown = reduced ? (words[0] ?? "") : text;

  return (
    <span className={cx("font-bold", className)}>
      {shown}
      {reduced ? null : <span className="tw-caret ml-0.5 text-accent">▌</span>}
    </span>
  );
}
