"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { profileToSearch } from "@/lib/taste/profile";
import {
  applyAnswer,
  EMPTY_PROFILE,
  type QuizOption,
  type QuizQuestion,
} from "@/lib/taste/quiz";

/**
 * The quiz, one question per screen. Answers stay in the browser until the
 * end, when they become the results link.
 */
export function QuizFlow({ questions }: { questions: QuizQuestion[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizOption[][]>([]);
  const [finishing, setFinishing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = answers.length;
  const question = questions[step];

  // Next.js keeps this page alive (hidden) after leaving it. A quiz left
  // halfway keeps its answers; a finished one starts over on return.
  const finished = useRef(false);
  useLayoutEffect(
    () => () => {
      if (!finished.current) return;
      finished.current = false;
      setAnswers([]);
      setFinishing(false);
    },
    [],
  );

  // Move focus to each new question so screen readers announce it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const answer = (chosen: QuizOption[]) => {
    const next = [...answers, chosen];
    if (next.length < questions.length) {
      setAnswers(next);
      return;
    }
    setFinishing(true);
    finished.current = true;
    const profile = next.reduce(applyAnswer, EMPTY_PROFILE);
    router.push(`/quiz/results?${profileToSearch(profile)}`);
  };

  if (!question) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span>
            Question {step + 1} of {questions.length}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setAnswers(answers.slice(0, -1))}
              className="-m-2 min-h-11 px-2"
            >
              ← Back
            </button>
          )}
        </div>
        <div
          aria-hidden="true"
          className="bg-surface h-2 overflow-hidden rounded-full"
        >
          <div
            className="bg-ink h-full rounded-full transition-[width] motion-reduce:transition-none"
            style={{ width: `${(step / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl leading-tight font-extrabold tracking-tight outline-none sm:text-4xl"
      >
        {question.prompt}
      </h2>

      {question.kind === "vibes" ? (
        <PickMany
          key={question.id}
          options={question.options}
          finishing={finishing}
          onDone={answer}
        />
      ) : (
        <ul
          className={`grid gap-3 ${
            question.options.length === 3 ? "sm:grid-cols-3" : "grid-cols-2"
          }`}
        >
          {question.options.map((option) => (
            <li key={option.id} className="flex">
              <OptionCard
                option={option}
                kind={question.kind}
                onPick={() => answer([option])}
              />
            </li>
          ))}
        </ul>
      )}

      {question.kind !== "vibes" && (
        <button
          type="button"
          onClick={() => answer([])}
          className="text-muted hover:text-ink -my-2 min-h-11 self-start font-bold underline underline-offset-4"
        >
          Skip — can’t decide
        </button>
      )}
    </div>
  );
}

function OptionCard({
  option,
  kind,
  onPick,
}: {
  option: QuizOption;
  kind: QuizQuestion["kind"];
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="bg-surface hover:border-ink focus-visible:border-ink flex w-full flex-col gap-3 rounded-3xl border-2 border-transparent p-3 text-left transition-colors sm:gap-4 sm:p-4"
    >
      {kind === "playlist" && (
        <span className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl sm:gap-1.5">
          {option.images.map((src) => (
            <span key={src} className="relative aspect-square">
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 640px) 160px, 22vw"
                className="object-cover"
              />
            </span>
          ))}
        </span>
      )}
      {kind === "clash" && option.images[0] && (
        <span className="relative aspect-video overflow-hidden rounded-2xl">
          <Image
            src={option.images[0]}
            alt=""
            fill
            sizes="(min-width: 640px) 340px, 45vw"
            className="object-cover"
          />
        </span>
      )}
      <span className="flex flex-col gap-1">
        <span className="text-lg leading-tight font-extrabold sm:text-xl">
          {option.label}
        </span>
        {option.detail && (
          <span className="text-muted text-sm font-medium">
            {option.detail}
          </span>
        )}
      </span>
    </button>
  );
}

function PickMany({
  options,
  finishing,
  onDone,
}: {
  options: QuizOption[];
  finishing: boolean;
  onDone: (chosen: QuizOption[]) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={picked.has(option.id)}
              onClick={() => toggle(option.id)}
              className={`border-ink inline-flex min-h-11 items-center rounded-full border-2 px-4 font-bold ${
                picked.has(option.id) ? "bg-ink text-white" : ""
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={finishing}
        onClick={() => onDone(options.filter((o) => picked.has(o.id)))}
        className="bg-ink inline-flex min-h-12 items-center self-start rounded-full px-6 text-lg font-bold text-white disabled:opacity-60"
      >
        {finishing ? "Finding your shows…" : "See my drops"}
      </button>
    </div>
  );
}
