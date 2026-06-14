import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run bootstrap-admin -- admin@example.com');
  process.exit(1);
}

if (getApps().length === 0) initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();
const user = await auth.getUserByEmail(email);

await auth.setCustomUserClaims(user.uid, {
  ...(user.customClaims ?? {}),
  role: 'admin',
  admin: true,
  collector: false,
});
await db.collection('users').doc(user.uid).set({
  uid: user.uid,
  email: user.email ?? email,
  role: 'admin',
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });
await db.collection('auditLogs').add({
  action: 'user.initial_admin_bootstrapped',
  actorUid: user.uid,
  actorEmail: user.email ?? email,
  targetUid: user.uid,
  targetEmail: user.email ?? email,
  newRole: 'admin',
  createdAt: FieldValue.serverTimestamp(),
});

console.log(`Admin access granted to ${email} (${user.uid}).`);
console.log('Sign out and sign in again so the new token claims take effect.');
