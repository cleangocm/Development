import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (getApps().length === 0) initializeApp();

const auth = getAuth();
const db = getFirestore();
const allowedRoles = ['customer', 'collector', 'admin'] as const;
type UserRole = (typeof allowedRoles)[number];

interface SetUserRoleInput { uid?: string; role?: string; }

export const setUserRole = onCall<SetUserRoleInput>(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
    if (request.auth.token.admin !== true) {
      throw new HttpsError('permission-denied', 'Only administrators can change roles.');
    }

    const uid = request.data.uid?.trim();
    const requestedRole = request.data.role?.trim();
    if (!uid || !requestedRole || !allowedRoles.includes(requestedRole as UserRole)) {
      throw new HttpsError('invalid-argument', 'A valid uid and role are required.');
    }
    if (uid === request.auth.uid) {
      throw new HttpsError('failed-precondition', 'Administrators cannot change their own role.');
    }

    const role = requestedRole as UserRole;
    const targetUser = await auth.getUser(uid);
    const targetRef = db.collection('users').doc(uid);
    const targetSnapshot = await targetRef.get();
    const previousRole = targetSnapshot.data()?.role ?? targetUser.customClaims?.role ?? 'customer';

    await auth.setCustomUserClaims(uid, {
      ...(targetUser.customClaims ?? {}),
      role,
      admin: role === 'admin',
      collector: role === 'collector',
    });

    const batch = db.batch();
    batch.set(targetRef, {
      uid,
      email: targetUser.email ?? targetSnapshot.data()?.email ?? '',
      role,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.collection('auditLogs').doc(), {
      action: 'user.role.updated',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email ?? null,
      targetUid: uid,
      targetEmail: targetUser.email ?? null,
      previousRole,
      newRole: role,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return { success: true, uid, role, message: 'Role updated. Sign in again to refresh access.' };
  },
);
