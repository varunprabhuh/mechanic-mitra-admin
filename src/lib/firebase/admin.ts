
import admin from 'firebase-admin';
import 'dotenv/config';

const firebaseAdminSdkConfig = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;

/**
 * Returns the initialized Firebase Admin app instance, creating it if it doesn't exist.
 * This pattern prevents re-initialization errors in a serverless environment.
 */
export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!firebaseAdminSdkConfig) {
    console.error('CRITICAL: FIREBASE_ADMIN_SDK_CONFIG_BASE64 environment variable is not set.');
    throw new Error('The server is missing critical configuration for Firebase Admin. Please contact support.');
  }

  try {
    const serviceAccount = JSON.parse(Buffer.from(firebaseAdminSdkConfig, 'base64').toString('utf-8'));
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    throw new Error('Firebase Admin could not be initialized. The configuration might be invalid.');
  }
}
