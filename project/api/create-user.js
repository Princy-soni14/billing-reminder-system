import admin from "firebase-admin";
import cors from "cors";

// ========== INIT FIREBASE ADMIN (VERCEL) ==========
// Use a global variable to cache the instance across invocations
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // 🚀 CRITICAL FIX: Handle newlines in private key
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Firebase Admin Init Error:", error.message);
  }
}

// ========= CORS HANDLER (Vercel Compatible) =========
const corsMiddleware = cors({
  methods: ["POST", "OPTIONS"],
  origin: true,
});

function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// ========== AUTH + ADMIN CHECK ==========
async function checkAuthAndAdmin(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized: No token provided." };
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (decoded.role !== "admin") {
      throw { status: 403, message: "Forbidden: Admin access required." };
    }

    return decoded;

  } catch (err) {
    console.error("Token Verification Failed:", err);
    throw { status: 401, message: `Unauthorized: ${err.message}` };
  }
}

// ========== MAIN HANDLER FOR VERCEL ==========
export default async function handler(req, res) {
  // Run CORS first
  await runCors(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Ensure Admin SDK is ready
    if (!admin.apps.length) {
      throw new Error("Firebase Admin failed to initialize. Check server logs.");
    }

    // Check admin access
    const adminUser = await checkAuthAndAdmin(req);

    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Create user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Set custom role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // ⭐ ADDED: Save user into Firestore "users" collection
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name,
      email: email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminUser.email,
    });

    console.log(`✅ User created by admin ${adminUser.email}`);

    return res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role,
    });

  } catch (err) {
    console.error("💥 API Error:", err.message || err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({ error: message });
  }
}
