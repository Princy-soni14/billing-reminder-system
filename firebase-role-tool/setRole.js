const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// make a user ADMIN
async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, {
    role: "admin",
    companyId: null,
  });
  console.log(`✅ User ${uid} is now ADMIN`);
}

// make a user tied to a company
async function setUser(uid, companyId) {
  await admin.auth().setCustomUserClaims(uid, {
    role: "user",
    companyId,
  });
  console.log(`✅ User ${uid} is now USER for company "${companyId}"`);
}

// run from terminal
const [,, type, uid, companyId] = process.argv;

if (!uid) {
  console.log("Usage:");
  console.log("  node setRole.js admin <uid>");
  console.log("  node setRole.js user <uid> <companyId>");
  process.exit(1);
}

if (type === "admin") {
  setAdmin(uid);
} else if (type === "user") {
  if (!companyId) {
    console.error("❌ CompanyId required for user role");
    process.exit(1);
  }
  setUser(uid, companyId);
} else {
  console.error('❌ First arg must be "admin" or "user"');
}
