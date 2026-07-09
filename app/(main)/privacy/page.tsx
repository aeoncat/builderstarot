import { Card } from "@/components/ui/card";

export const metadata = { title: "Privacy — Builder's Tarot" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Privacy</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">What we collect, plainly</h1>
      </div>

      <Card className="space-y-4 text-sm leading-6 text-[#d5cfda]">
        <section>
          <h2 className="font-display text-lg font-black text-[#f1eee7]">Product analytics</h2>
          <p className="mt-1">
            We record anonymous product events (like &quot;a reading was completed&quot;) to understand whether
            Builder&apos;s Tarot is useful. Events carry a random identifier stored in your browser — no IP
            address, no location, no device fingerprinting, no advertising identifiers. Events never include
            your project context, reading text, journal notes, or email address. Raw events are kept for at
            most 180 days.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-black text-[#f1eee7]">Your project context</h2>
          <p className="mt-1">
            The context you type into a project reading is used to shape that reading in the moment. It is not
            stored on our servers. When you save a reading to your journal, we store the rendered reading text
            and a short subject phrase (like &quot;your habit tracker&quot;) — never your full context paragraph.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-black text-[#f1eee7]">Accounts and the journal</h2>
          <p className="mt-1">
            If you create an account, we store your email, your saved journal entries, and your favorites — that
            is what makes them available across devices. Guest journals live entirely in your browser.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-black text-[#f1eee7]">The Pro waitlist</h2>
          <p className="mt-1">
            Joining the Pro waitlist stores your email and your plan preference, nothing else. We email you only
            about Builder&apos;s Tarot. To be removed, reply to any email or contact us and we will delete your
            entry.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-black text-[#f1eee7]">What this product is</h2>
          <p className="mt-1">
            Builder&apos;s Tarot is a reflection tool built on structured randomness. It does not predict the
            future, and it is not therapy, medical, financial, or legal advice.
          </p>
        </section>
      </Card>
    </div>
  );
}
