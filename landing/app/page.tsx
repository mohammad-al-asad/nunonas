import Image from "next/image";
import { StoreBadges } from "@/components/StoreBadges";
import { PROVIDER_PORTAL_URL } from "@/lib/site";

const features = [
  {
    image: "/discover-experience.png",
    title: "Discover experiences",
    body: "Hotels, spas, restaurants and events near you, all in one place with real photos, prices and reviews.",
  },
  {
    image: "/plan-smarter-with-ai.png",
    title: "Plan smarter with AI",
    body: "Tell Activity Planner what you're in the mood for and get a day plan that fits your time, budget and location.",
  },
  {
    image: "/book-easily.png",
    title: "Book in a few taps",
    body: "Pick a time, confirm and you're done. Earn loyalty points and unlock offers on every booking.",
  },
];

const steps = [
  { title: "Create your account", body: "Sign up with your email in under a minute." },
  { title: "Explore what's nearby", body: "Browse by category or let the AI planner suggest a day out." },
  { title: "Book and enjoy", body: "Confirm instantly and keep every booking in one place." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800">
              Your activity planner
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Discover, plan and book <span className="text-brand-600">activities near you</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Activity Planner brings hotels, spas, restaurants and events together in one app, with an AI planner that builds
              your perfect day.
            </p>
            <div className="mt-8">
              <StoreBadges />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-6 rounded-[2.5rem] bg-brand-800/10 blur-2xl" />
            <Image
              src="/discover-experience.png"
              alt="A city map with pins marking activities to book"
              width={640}
              height={600}
              className="relative h-auto w-full"
              priority
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Everything for a great day out</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          One app for finding, planning and booking, so you spend less time searching and more time enjoying.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-40 items-center justify-center rounded-xl bg-brand-50">
                <Image src={feature.image} alt="" width={200} height={160} className="h-32 w-auto object-contain" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-brand-800 px-8 py-12 text-white md:flex-row md:px-12">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Get Activity Planner on your phone</h2>
            <p className="mt-2 text-brand-100">Free on iOS and Android.</p>
            <p className="mt-4 text-sm text-brand-100">
              Run a hotel, spa, restaurant or venue?{" "}
              <a href={PROVIDER_PORTAL_URL} className="font-semibold text-white underline underline-offset-4">
                List your business on Activity Planner
              </a>
            </p>
          </div>
          <StoreBadges />
        </div>
      </section>
    </>
  );
}
