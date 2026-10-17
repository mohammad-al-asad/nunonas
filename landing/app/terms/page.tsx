import type { Metadata } from "next";
import { SUPPORT_EMAIL, TERMS_LAST_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Activity Planner app and website.",
};

const sections: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. About these terms",
    paragraphs: [
      'These Terms of Service ("Terms") govern your use of the Activity Planner mobile app, the website at meetz4u.xyz and the related service provider and admin portals (together, the "Service"). By creating an account or using the Service you agree to these Terms. If you do not agree, do not use the Service.',
    ],
  },
  {
    title: "2. Who can use Activity Planner",
    paragraphs: [
      "You must be at least 18 years old, or the age of majority where you live, to create an account and make bookings. You are responsible for keeping your login details secure and for all activity on your account.",
      "You agree to give accurate information when you register and to keep it up to date. We may suspend or close accounts that use false information or break these Terms.",
    ],
  },
  {
    title: "3. Bookings",
    paragraphs: [
      "Activity Planner is a platform that connects you with independent service providers such as hotels, spas, restaurants and event organisers. When you book, your contract for the activity is with the service provider, not with Activity Planner.",
      "Prices, availability, descriptions and cancellation rules are set by each service provider and shown before you confirm. A booking is only confirmed once you receive a confirmation in the app.",
      "If you need to cancel or change a booking, follow the cancellation policy shown for that booking. Refunds, where available, are handled under that policy.",
    ],
  },
  {
    title: "4. Loyalty points and offers",
    paragraphs: [
      "You may earn loyalty points on eligible bookings and receive promotional offers. Points and offers have no cash value, cannot be transferred and may expire or change. We may cancel points obtained through fraud, error or misuse.",
    ],
  },
  {
    title: "5. AI planning features",
    paragraphs: [
      "Activity Planner can suggest activities and itineraries using automated tools. Suggestions are for convenience only and may not always be accurate or available. Check the details before you book or travel.",
    ],
  },
  {
    title: "6. Service providers",
    paragraphs: [
      "Businesses that list on Activity Planner must hold any licences required for their services, provide accurate listings and honour confirmed bookings. Service providers agree to the commission and billing terms shown in the provider portal.",
      "Activity Planner may review, hide or remove listings that are misleading, unsafe or against these Terms.",
    ],
  },
  {
    title: "7. Acceptable use",
    paragraphs: [
      "You agree not to misuse the Service. This includes posting false reviews, harassing other users or providers, attempting to access accounts or systems without permission, scraping data, or using the Service for anything unlawful.",
    ],
  },
  {
    title: "8. Content you share",
    paragraphs: [
      "You keep ownership of the photos, reviews and other content you upload. You give Activity Planner a non-exclusive, worldwide, royalty-free licence to host, display and use that content to operate and promote the Service. Do not upload content you do not have the right to share.",
    ],
  },
  {
    title: "9. Privacy",
    paragraphs: [
      "We collect and use personal information, such as your name, email address, location and booking history, to provide the Service. We share booking details with the service provider you book with so they can fulfil your booking.",
    ],
  },
  {
    title: "10. Availability and changes",
    paragraphs: [
      "We work to keep Activity Planner available but do not guarantee it will be uninterrupted or error-free. We may change, suspend or discontinue features at any time.",
      "We may update these Terms from time to time. When we make material changes we will notify you in the app or by email. Continuing to use the Service after changes take effect means you accept the updated Terms.",
    ],
  },
  {
    title: "11. Liability",
    paragraphs: [
      'The Service is provided "as is". To the extent permitted by law, Activity Planner is not responsible for the services delivered by providers, or for indirect or consequential losses. Nothing in these Terms limits liability that cannot be limited by law.',
    ],
  },
  {
    title: "12. Ending your account",
    paragraphs: [
      "You can stop using Activity Planner and request deletion of your account at any time. We may suspend or end your access if you break these Terms. Sections that by their nature should survive termination will continue to apply.",
    ],
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: {TERMS_LAST_UPDATED}</p>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-brand-800">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="text-xl font-semibold text-brand-800">13. Contact us</h2>
          <p className="mt-3 leading-relaxed text-slate-700">
            Questions about these Terms? Email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-600 underline underline-offset-4">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
