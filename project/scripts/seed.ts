// scripts/seed.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  mockCompanies,
  mockCompanyCC,
  mockBills,
  defaultEmailTemplates,
} from "../src/data/mockData.ts";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(fs.readFileSync(path.join(__dirname, "../serviceAccountKey.json"), "utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const chunks = <T,>(arr:T[], size=400) =>
  Array.from({ length: Math.ceil(arr.length/size) }, (_, i) => arr.slice(i*size, i*size+size));

async function seed() {
  // companies
  for (const group of chunks(mockCompanies)) {
    const batch = db.batch();
    for (const c of group) {
      batch.set(db.collection("companies").doc(c.id), {
        ...c,
        nameLower: c.name.toLowerCase(),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }

  // ccEmails subcollection
  for (const group of chunks(mockCompanyCC)) {
    const batch = db.batch();
    for (const cc of group) {
      batch.set(
        db.collection("companies").doc(cc.companyId).collection("ccEmails").doc(cc.id),
        { email: cc.email, name: cc.name ?? null, createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    await batch.commit();
  }

  // bills
  for (const group of chunks(mockBills)) {
    const batch = db.batch();
    for (const b of group) {
      const comp = mockCompanies.find(x => x.id === b.companyId);
      batch.set(db.collection("bills").doc(b.id), {
        ...b,
        companyName: comp?.name ?? null,       // handy for emails/search
        billNoLower: b.billNo.toLowerCase(),    // for prefix search
        lastReminderSent: b.lastReminderSent
          ? Timestamp.fromDate(new Date(b.lastReminderSent))
          : null,
      }, { merge: true });
    }
    await batch.commit();
  }

  // email templates
  for (const group of chunks(defaultEmailTemplates)) {
    const batch = db.batch();
    for (const t of group) {
      batch.set(db.collection("emailTemplates").doc(t.id), {
        ...t,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }

  console.log("✅ Firestore seeded from src/data/mockData.ts");
}

seed().catch(err => { console.error(err); process.exit(1); });
