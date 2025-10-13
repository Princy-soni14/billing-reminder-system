import { db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

/** Get one company by id */
export async function getMyCompany(companyId: string) {
  const snap = await getDoc(doc(db, "companies", companyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** List companies depending on role */
export async function listCompaniesFor(
  role: "admin" | "user",
  companyId?: string
) {
  if (role === "user" && companyId) {
    const snap = await getDoc(doc(db, "companies", companyId));
    return snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
  }
  const snap = await getDocs(collection(db, "companies"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
