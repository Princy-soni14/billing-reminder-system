import admin from "firebase-admin";
import cors from "cors";
// ========== INIT FIREBASE ADMIN (VERCEL) ==========
let initialized = false;

function initAdmin() {
  if (initialized) return;

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountString) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT is missing.");
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
  }

  // Parse the string into an object
  const serviceAccount = JSON.parse(serviceAccountString);

  // 🚀 FIX: Replace literal '\n' with actual newlines in the private key
  // This is the critical fix for "Invalid PEM formatted message"
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
}

initAdmin();

// ========= CORS HANDLER (Vercel Compatible) =========
function runCors(req, res) {
  return new Promise((resolve, reject) => {
    cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://billing-reminder-system.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})
(req, res, (result) => {
      if (result instanceof Error) reject(result);
      resolve(result);
    });
  });
}

// ========== AUTH + ADMIN CHECK (Updated for Debugging) ==========
async function checkAuthAndAdmin(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Unauthorized: No token provided." };
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (decoded.role !== "admin") {
      console.error(`User ${decoded.email} is NOT admin. Role: ${decoded.role}`);
      throw { status: 403, message: "Forbidden: Admin access required." };
    }

    return decoded;

  } catch (err) {
    // 🚀 THIS IS THE FIX: Log the actual error so we know WHY it failed
    console.error("💥 Auth Verification Failed:", err.code, err.message);
    
    // Send the specific error message back to the frontend
    throw { status: 401, message: `Unauthorized: ${err.message}` };
  }
}

// ========== MAIN HANDLER FOR VERCEL ==========
export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    console.log(`✅ User created by admin ${adminUser.email}`);

    return res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role,
    });

  } catch (err) {
    console.error("💥 Create user error:", err.message || err);

    return res.status(err.status || 500).json({
      error: err.message || "Failed to create user",
    });
  }
}
