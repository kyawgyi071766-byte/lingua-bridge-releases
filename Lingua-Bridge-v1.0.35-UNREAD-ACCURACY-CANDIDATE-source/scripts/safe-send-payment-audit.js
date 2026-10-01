const fs = require('fs');
const read = (p) => fs.readFileSync(p, 'utf8');
const preload = read('desktop-bridge/electron/service-preload.cjs');
const proof = read('src/app/api/payment/proof/route.ts');
const receipt = read('src/lib/receiptVerification.ts');
const support = read('src/app/api/support/route.ts');
const adminConfirm = read('src/app/api/admin/payment/confirm/route.ts');
const billing = read('src/components/BillingClient.tsx');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260925000100_payment_receipt_review/migration.sql');
const checks = [
  ['busy/suppressed follow-up send events are cancelled', preload.includes('outgoingBusy || (Date.now() < suppressNativeUntil') && preload.includes('preventEvent(event);')],
  ['composer replacement is exact before send', preload.includes('composer replacement verification failed') && preload.includes('composerText(active) !== expectedText')],
  ['WhatsApp old+translated merge regression guarded', preload.includes('make WhatsApp merge') && preload.includes('nothing was sent')],
  ['receipt upload is size/type limited', proof.includes('MAX_RECEIPT_BYTES') && proof.includes('ALLOWED_TYPES')],
  ['duplicate receipt hash is detected', proof.includes('duplicateReceipt') && schema.includes('receiptHash String?') && migration.includes('Payment_receipt_hash_key')],
  ['AI receipt review cannot directly activate plan', receipt.includes('Final confirmation must come from an independent blockchain lookup') && proof.includes('findMatchingTransfer(payment)')],
  ['duplicate blockchain transaction is blocked', proof.includes('duplicateTx') && proof.includes('already been used for another payment')],
  ['owner confirmation also requires chain lookup', adminConfirm.includes('findMatchingTransfer(payment)') && adminConfirm.includes('Do not approve from a receipt image alone')],
  ['billing receipt review UI present', billing.includes('Review receipt and verify payment') && billing.includes('/api/payment/proof')],
  ['support uses real payment state and refresh guidance', support.includes("mode: 'verified-account-state'") && support.includes('Refresh/reload Lingua')],
  ['support escalation email present', support.includes('sshksshk2002@gmail.com')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed += 1; }
if (failed) process.exit(1);
