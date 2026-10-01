export default function PrivacyPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 legal">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> September 19, 2026</p>
      <p>Lingua Translate processes account information and translation requests so the service can operate. This starter policy must be reviewed and customized for the legal entity, country, and providers used before public launch.</p>
      <h2>Information we process</h2>
      <p>Account data can include your email address, optional name, password hash, plan, usage counters, payment status, and blockchain transaction references. Passwords are stored only as one-way hashes.</p>
      <h2>Translation text</h2>
      <p>Text you submit for translation is sent to the translation provider configured by the service owner, such as DeepL or Google Cloud Translation. Lingua does not intentionally store translation text in its application database. Chat history and preferences in the current product are stored locally in your browser.</p>
      <h2>Payments and email</h2>
      <p>Paid plans are purchased with USDT sent to the configured owner wallet. Blockchain transfers are public on the relevant network, and Lingua stores the minimum payment record needed to match and activate a plan. Transactional account emails can be delivered through Resend when configured.</p>
      <h2>Customer support</h2>
      <p>If AI support is enabled, support messages and limited signed-in account context such as email, plan, and suspension status can be sent to the configured OpenAI-compatible provider to answer the request. Do not send wallet seed phrases, private keys, passwords, or one-time codes through support.</p>
      <h2>Security and retention</h2>
      <p>Lingua uses encrypted HTTPS transport in production, httpOnly session cookies, server-side API keys, rate limiting, and server-side blockchain verification. Account and payment records are retained while needed to provide the service and meet legal or accounting requirements.</p>
      <h2>Your choices</h2>
      <p>You may request access, correction, or deletion of your account where applicable. Crypto transfers themselves cannot be deleted from the public blockchain.</p>
      <h2>Contact</h2>
      <p>For privacy questions, contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
    </div>
  );
}
export const metadata = { title: 'Privacy', alternates: { canonical: '/privacy' } };
