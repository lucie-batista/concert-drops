import type { Metadata } from "next";

import { QuizFlow } from "@/components/quiz-flow";
import { SiteHeader } from "@/components/site-header";
import { getQuizData } from "@/lib/taste/queries";

export const metadata: Metadata = {
  title: "Try your taste · concert-drops",
  description:
    "Eight quick picks, then the upcoming ticket drops that fit your taste.",
};

export default async function QuizPage() {
  const { cityName, questions } = await getQuizData();

  return (
    <>
      <SiteHeader current="/quiz" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl leading-[0.95] font-extrabold tracking-tighter sm:text-6xl sm:leading-[0.9]">
            What should you see in {cityName}?
          </h1>
          <p className="text-muted text-lg font-medium">
            The rest of this site runs on my Spotify. This demo runs on yours:
            eight quick picks from real upcoming shows, then the ticket drops
            that fit your taste. No login, and nothing is saved.
          </p>
        </div>
        <QuizFlow questions={questions} />
      </main>
    </>
  );
}
