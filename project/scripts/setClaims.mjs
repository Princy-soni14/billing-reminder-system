// scripts/setClaims.mjs
import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const sa = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
initializeApp({ credential: cert(sa) });

// TODO: replace with the real UIDs from Firebase Console → Authentication → Users
const ADMIN_UID = "CSRoaqHTqPWrD0AYwv5JzN8PO5d2";
const COMPANY_UID = "Cp5C9ow0ADYMkfzoXNrKWZAGWLQ2";
const COMPANY_UID = "UPodfVXxdIQ1uLdDoWFyiaumG9w2";


await getAuth().setCustomUserClaims(ADMIN_UID, { role: "admin" });
await getAuth().setCustomUserClaims(COMPANY_UID, { role: "user", companyId: "comp-001" });

await getAuth().setCustomUserClaims("UID_OF_XYZ_USER", {
  role: "user",
  companyId: "comp-002"  
});


console.log("✅ Claims set: admin + company user (comp-001)");
