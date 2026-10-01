export default function TermsPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 legal">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> September 19, 2026</p>
      <p>These starter terms describe the intended Lingua Translate service and must be reviewed and customized for the operating business and jurisdiction before launch.</p>
      <h2>Service</h2>
      <p>Lingua provides automated machine translation and related copy/share workflows. Translation can contain errors, omissions, or ambiguous wording. Do not rely on automated translation alone for medical, legal, emergency, safety-critical, or other high-stakes decisions.</p>
      <h2>Accounts</h2>
      <p>You are responsible for maintaining the security of your account and for activity performed through it. You must provide accurate registration information and may not abuse, probe, disrupt, or resell access in a way that exceeds your plan or violates applicable law.</p>
      <h2>Subscriptions</h2>
      <p>Paid plans provide 30 days of access after a confirmed USDT payment. They do not automatically renew. The exact USDT amount, network, and receiving wallet are shown before payment. The checkout amount can include temporary identification cents (up to $0.99 above the listed base price) so an incoming transfer can be matched without a memo. When paid access expires, the account returns to the Free plan unless a new paid period has been confirmed.</p>
      <h2>Usage limits</h2>
      <p>Each plan includes a monthly character allowance and reasonable request-rate limits intended to protect service reliability. Limits can be adjusted for future plans with notice where required.</p>
      <h2>Availability</h2>
      <p>The service depends on third-party hosting, blockchain explorers, email, AI support, and translation providers. Continuous or error-free availability is not guaranteed.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
    </div>
  );
}
export const metadata = { title: 'Terms', alternates: { canonical: '/terms' } };
