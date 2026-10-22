export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-24 sm:px-8">
      <div className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
        <span aria-hidden="true" className="bg-presale size-7 rounded-lg" />
        concert-drops
      </div>
      <h1 className="text-6xl leading-[0.9] font-extrabold tracking-tighter sm:text-8xl">
        Don’t miss
        <br />
        the drop.
      </h1>
      <p className="text-muted max-w-xl text-xl font-medium">
        Presales and on-sales for the artists I actually listen to, ranked by
        how much I’d want to be there.
      </p>
      <p className="bg-onsale self-start rounded-full px-4 py-2 text-sm font-bold">
        In progress
      </p>
    </main>
  );
}
