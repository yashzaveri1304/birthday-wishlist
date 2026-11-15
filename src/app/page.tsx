import { Suspense } from "react";
import { connection } from "next/server";
import { Background } from "@/components/Background";
import { Hero } from "@/components/Hero";
import { GiftList } from "@/components/GiftList";
import { MotionProvider } from "@/components/MotionProvider";
import { getPublicItems } from "@/lib/items";

async function Gifts() {
  await connection(); // always fetch fresh data per visit
  const items = await getPublicItems().catch((e) => {
    console.error(e);
    return null;
  });
  if (!items) {
    return (
      <p className="mx-auto max-w-sm rounded-3xl bg-white/70 p-8 text-center text-ink-soft">
        Couldn’t load the gifts right now. Please refresh in a moment.
      </p>
    );
  }
  return <GiftList initialItems={items} />;
}

function GiftsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-[1.25rem] bg-petal sm:rounded-[1.6rem]"
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <MotionProvider>
      <Background />
      <Hero
        owner={process.env.NEXT_PUBLIC_OWNER_NAME || "Aashni Shah"}
        birthday={process.env.NEXT_PUBLIC_BIRTHDAY || "2009-12-29"}
      />
      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <Suspense fallback={<GiftsSkeleton />}>
          <Gifts />
        </Suspense>
      </main>
      <footer className="pb-12 text-center font-display text-sm text-ink-soft italic">
        With love, on the 29th
      </footer>
    </MotionProvider>
  );
}
