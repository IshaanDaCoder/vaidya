import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Terms and Conditions — Vaidya",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-semibold text-trust-dark">
          Vaidya
        </Link>
        <ThemeToggle />
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-foreground">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 10 August 2026</p>

      <div className="prose prose-sm mt-10 max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of these terms</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            These Terms and Conditions (&quot;Terms&quot;) govern your access to and use
            of Vaidya, an online platform that connects patients across India with
            doctors for online consultation (the &quot;Platform&quot;). By creating an
            account, logging in, or otherwise using the Platform, you agree to be
            bound by these Terms. If you do not agree, do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Definitions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>
              <strong>&quot;Doctor&quot;</strong> means a registered medical
              practitioner who has created a doctor account on the Platform.
            </li>
            <li>
              <strong>&quot;Patient&quot;</strong> means an individual who has created
              a patient account on the Platform to seek consultation.
            </li>
            <li>
              <strong>&quot;Consultation&quot;</strong> means an online interaction
              (video or otherwise) booked through the Platform between a Doctor
              and a Patient.
            </li>
            <li>
              <strong>&quot;You&quot;</strong> refers to any Doctor or Patient using
              the Platform.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Eligibility</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            You must be at least 18 years old to create an account. If you are
            registering as a Doctor, you represent and warrant that you hold a
            valid, current medical registration recognized in India, and that
            all qualifications, specialization, and registration details you
            submit are accurate and truthful. Vaidya reserves the right to
            verify this information and to reject or suspend a Doctor account
            at its discretion if verification cannot be completed
            satisfactorily.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Account registration and security</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You must notify us promptly of any unauthorized use of
            your account. Account type (Doctor or Patient) is selected at
            signup and cannot be changed afterward — a new account is required
            to use the Platform under a different role.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Doctor obligations</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Doctors using the Platform agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>
              Practice in accordance with the Telemedicine Practice Guidelines,
              2020 issued under the Indian Medical Council Act, and all
              applicable state and national medical council regulations.
            </li>
            <li>
              Not prescribe any medication restricted from telemedicine
              prescription under applicable law (including Schedule X drugs
              and other prohibited categories).
            </li>
            <li>
              Display their medical registration number accurately on their
              Platform profile.
            </li>
            <li>
              Maintain a valid, active subscription to remain listed and
              bookable on the Platform, as described in Section 7.
            </li>
            <li>
              Access a Patient&apos;s information only in connection with a
              Consultation that Patient has actually booked with them.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Patient obligations</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Patients agree to provide accurate information when booking a
            Consultation, to attend booked Consultations in good faith, and to
            engage with Doctors respectfully. Misuse of the Platform,
            including providing false information to obtain a free
            Consultation or repeated no-shows, may result in account
            suspension.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Fees and payments</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Doctors pay a recurring subscription fee to be listed and
            discoverable on the Platform. Patients receive one free
            Consultation, valid once per patient across the entire Platform;
            every Consultation after that first free one is paid directly for
            that Consultation, at the fee set by the Doctor. All payments are
            processed through Razorpay; Vaidya does not store your full
            payment card details. Fees, once paid for a completed
            Consultation, are generally non-refundable except where a Doctor
            fails to attend a booked Consultation, in which case a refund or
            rebooking will be offered.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Reviews</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Patients may leave a rating and review only after a Consultation
            they attended has been marked completed. Reviews must reflect a
            genuine Consultation experience. Vaidya reserves the right to
            remove reviews that are abusive, fraudulent, or otherwise violate
            these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            9. Data privacy and the Digital Personal Data Protection Act, 2023
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Vaidya processes your personal data in accordance with the
            Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and
            other applicable Indian data protection law. This section
            describes how.
          </p>
          <h3 className="mt-4 text-sm font-semibold">9.1 What we collect and why</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            We collect the personal data you provide at signup and during use
            of the Platform — including your name, email, phone number, role
            (Doctor or Patient), city, and, for Doctors, professional
            qualifications and license information — solely to operate the
            Platform: to create and secure your account, connect Doctors and
            Patients, process bookings and payments, and communicate with you
            about your Consultations.
          </p>
          <h3 className="mt-4 text-sm font-semibold">9.2 Consent</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            We collect your explicit, informed consent to this processing at
            the time you create your account, and we record the date and time
            that consent was given. You may withdraw your consent at any time
            by deleting your account or contacting us as described in Section
            9.6; withdrawing consent may mean we can no longer provide you the
            Platform&apos;s services.
          </p>
          <h3 className="mt-4 text-sm font-semibold">9.3 Your rights as a Data Principal</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            Under the DPDP Act, you have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>Access a summary of the personal data we hold about you;</li>
            <li>Request correction or completion of inaccurate or incomplete data;</li>
            <li>
              Request erasure of your personal data, subject to our legal
              obligation to retain certain records (such as consultation and
              payment records) for the periods required by applicable law;
            </li>
            <li>
              Withdraw consent to processing at any time, as described above;
            </li>
            <li>
              Register a grievance regarding how your personal data has been
              processed, and receive a response within a reasonable time.
            </li>
          </ul>
          <h3 className="mt-4 text-sm font-semibold">9.4 Data we do not collect</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            At this time, Vaidya does not collect or store detailed medical
            history or health records within the Platform itself. Any medical
            information shared during a Consultation is shared directly
            between Doctor and Patient and is governed by the Doctor&apos;s own
            professional and legal obligations, not by the Platform.
          </p>
          <h3 className="mt-4 text-sm font-semibold">9.5 Data security</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            We restrict access to your personal data on a need-to-know basis —
            for example, a Doctor can only access a Patient&apos;s profile in
            connection with a Consultation that Patient actually booked with
            them, never the full patient directory. Documents submitted for
            Doctor verification are stored in a private, access-controlled
            location and are not publicly accessible.
          </p>
          <h3 className="mt-4 text-sm font-semibold">9.6 Grievance Officer</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            For any question, request, or grievance regarding your personal
            data or these Terms, contact our Grievance Officer at{" "}
            <span className="font-medium">ishaanmandore333@gmail.com</span>. We aim to acknowledge grievances promptly and
            resolve them within the timelines required under applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Medical disclaimer</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Vaidya is a technology platform that facilitates connections
            between Doctors and Patients. Vaidya is not a healthcare provider,
            does not practice medicine, and is not responsible for the medical
            advice, diagnosis, or treatment given by any Doctor. Vaidya is not
            an emergency service — if you are experiencing a medical
            emergency, contact your local emergency services or visit the
            nearest hospital immediately; do not rely on the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Limitation of liability</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            To the fullest extent permitted by law, Vaidya is not liable for
            any indirect, incidental, or consequential damages arising from
            your use of the Platform, including damages arising from the
            conduct or advice of any Doctor or Patient. Nothing in these
            Terms limits liability that cannot be excluded under applicable
            Indian law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Termination</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            You may stop using the Platform and request account deletion at
            any time. Vaidya may suspend or terminate an account that
            violates these Terms, provides false verification information, or
            otherwise misuses the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Governing law</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            These Terms are governed by the laws of India. Any dispute arising
            from these Terms or your use of the Platform is subject to the
            exclusive jurisdiction of the courts of India.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">14. Changes to these terms</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            We may update these Terms from time to time. Material changes
            will be notified to you before they take effect. Continued use of
            the Platform after changes take effect constitutes acceptance of
            the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">15. Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Questions about these Terms can be directed to{" "}
            <span className="font-medium">ishaanmandore333@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
