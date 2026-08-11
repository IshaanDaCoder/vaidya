import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const steps = [
  {
    step: "01",
    title: "Sign up free",
    description: "Create a patient account in under a minute — no cost, no card required.",
  },
  {
    step: "02",
    title: "Find a verified doctor",
    description: "Search by specialty and city. Every doctor's registration is checked before they're listed.",
  },
  {
    step: "03",
    title: "Consult online",
    description: "Your first consultation is free. Pay directly to the doctor from your second visit onward.",
  },
];

const trustPoints = [
  {
    title: "Verified doctors only",
    description: "Every doctor submits their medical registration for review before they can be booked.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6l7-3z M9 12l2 2 4-4"
      />
    ),
  },
  {
    title: "Your data, protected",
    description: "A doctor can only see your details if you've actually booked with them — never a shared directory.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10V7a6 6 0 1112 0v3 M5 10h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"
      />
    ),
  },
  {
    title: "First visit, free",
    description: "One free consultation, on us, so you can find the right doctor before you pay for anything.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7-4.4-9.5-8.7C.8 8.4 2.3 5 6 5c2.1 0 3.7 1.2 6 3.3C14.3 6.2 15.9 5 18 5c3.7 0 5.2 3.4 3.5 6.8-2.5 4.3-9.5 8.7-9.5 8.7z"
      />
    ),
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl font-semibold text-trust-dark dark:text-trust">
            Vaidya
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/signup?role=patient"
              className="rounded-full bg-trust px-4 py-2 font-medium text-white shadow-sm shadow-trust/20 transition-colors hover:bg-trust-dark"
            >
              Sign up
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-noise relative overflow-hidden border-b border-line">
          <div className="mx-auto max-w-3xl px-6 py-28 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-trust-dark dark:text-trust">
              Now connecting patients &amp; doctors across India
            </span>
            <h1 className="mt-8 font-serif text-4xl leading-[1.12] font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
              Talk to a verified doctor,
              <br />
              from anywhere in India.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Vaidya connects patients with verified doctors for online
              consultation — in Mumbai, Delhi, a small town, or anywhere in
              between. Your first consultation is free.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup?role=patient"
                className="w-full rounded-full bg-trust px-7 py-3.5 text-center text-sm font-medium text-white shadow-md shadow-trust/25 transition-colors hover:bg-trust-dark sm:w-auto"
              >
                I&apos;m a patient
              </Link>
              <Link
                href="/signup?role=doctor"
                className="w-full rounded-full border border-line bg-surface px-7 py-3.5 text-center text-sm font-medium text-foreground transition-colors hover:border-trust hover:text-trust-dark dark:hover:text-trust sm:w-auto"
              >
                I&apos;m a doctor
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              How it works
            </h2>
            <div className="relative mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3">
              <div className="pointer-events-none absolute top-5 left-0 right-0 hidden h-px bg-line sm:block" />
              {steps.map((s) => (
                <div key={s.step} className="relative bg-background pr-6">
                  <div className="font-serif text-sm font-semibold text-trust">{s.step}</div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Built to be trusted
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {trustPoints.map((t) => (
                <div
                  key={t.title}
                  className="rounded-xl border border-line bg-background p-7 transition-shadow hover:shadow-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-8 w-8 text-trust"
                  >
                    {t.icon}
                  </svg>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For doctors */}
        <section className="relative overflow-hidden bg-trust-dark">
          <div className="bg-noise absolute inset-0 opacity-[0.12]" />
          <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-teal-100">
              For doctors
            </span>
            <h2 className="mt-6 font-serif text-2xl font-semibold text-white sm:text-3xl">
              Reach more patients, on your terms.
            </h2>
            <p className="mt-4 text-teal-50/90">
              A patient&apos;s first consultation with Vaidya is free for
              them — you charge from their second visit onward. A
              subscription keeps you listed and discoverable to patients
              searching in your city.
            </p>
            <Link
              href="/signup?role=doctor"
              className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-medium text-trust-dark shadow-md transition-colors hover:bg-teal-50"
            >
              Join as a doctor
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted sm:flex-row">
          <span className="font-serif text-sm text-foreground">Vaidya</span>
          <span>© {new Date().getFullYear()} Vaidya. All rights reserved.</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms and Conditions
          </Link>
        </div>
      </footer>
    </>
  );
}
