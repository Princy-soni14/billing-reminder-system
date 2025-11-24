// src/components/BulkUploadCompaniesModal.tsx
import React, { useState } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[], type: "bills" | "companies") => void;
}

const REQUIRED_COLUMNS = [
  "name",
  "address",
  "city",
  "contact no.",
  "e-mail & website",
  "bank name",
  "bank branch name",
  "bank address",
  "bank ifsc code",
  "bank account no.",
  "iban no.",
  "swift code",
];

const normalize = (s: any) => (s === undefined || s === null ? "" : String(s).trim());

const parseCompaniesExcel = async (file: File) => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // 🔍 Convert full sheet → rows (2D array)
  const sheetJson = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: ""
  }) as any[][];

  // 🔍 Auto-detect header row (within first 20 rows)
  let headerRowIndex = -1;

  for (let i = 0; i < 20 && i < sheetJson.length; i++) {
    const row = sheetJson[i].map((c: any) =>
      String(c).trim().toLowerCase()
    );

    if (
      row.includes("name") ||
      row.includes("company name") ||
      row.includes("address") ||
      row.includes("contact no.") ||
      row.includes("e-mail & website")
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Cannot detect header row — invalid company file format.");
  }

  // 📌 Now parse using this detected header row
  const raw = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    range: headerRowIndex, // dynamic header row here
  }) as Record<string, any>[];

  if (!raw || raw.length === 0) {
    throw new Error("Empty or unreadable file");
  }

  // 🧹 Normalize keys → lowercase trimmed
  const rows = raw.map((r) => {
    const mapped: Record<string, string> = {};
    for (const k of Object.keys(r)) {
      mapped[k.toLowerCase().trim()] = normalize(r[k]);
    }
    return mapped;
  });

  return rows;
};


const BulkUploadCompaniesModal: React.FC<Props> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validExt = [".xlsx", ".xls", ".csv"];
    if (!validExt.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      toast.error("Please upload Excel or CSV file");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    setIsProcessing(true);

    try {
      const parsed = await parseCompaniesExcel(file);
      if (!parsed.length) throw new Error("No rows found in file");

      // Build a name -> row array (use name column)
      const keyed: Record<string, any>[] = [];
      for (const r of parsed) {
        // try find the name key from common header variants
        const nameKey =
          r["name"] ||
          r["company name"] ||
          r["company"] ||
          r["companyname"] ||
          r["company name "];
        if (!nameKey || nameKey === "") continue;
        keyed.push(r);
      }

      if (!keyed.length) throw new Error("No company NAME column found in file");

      // Get existing companies
      const snap = await getDocs(collection(db, "companies"));
      const existingMap = new Map<string, any>(); // nameLower -> doc data

      snap.docs.forEach((d) => {
        const data = d.data();
        const nameLower = (data.nameLower || (data.name || "")).toString().toLowerCase().trim();
        existingMap.set(nameLower, { id: d.id, ...data });
      });

      const batch = writeBatch(db);
      let created = 0;
      let updated = 0;

      for (const row of keyed) {
        const rawName =
          row["name"] ||
          row["company name"] ||
          row["company"] ||
          row["companyname"] ||
          row["company name "];
        const name = normalize(rawName);
        const nameLower = name.toLowerCase().trim();

        // Build the fields we can set/update (only if provided)
        const address = row["address"] || row["address "] || "";
        const city = row["city"] || "";
        const phone = row["contact no."] || row["contact no"] || row["phone"] || row["contact"] || "";
        const email = row["e-mail & website"] || row["email"] || row["e-mail"] || "";
        // bank fields
        const bankName = row["bank name"] || "";
        const bankBranch = row["bank branch name"] || "";
        const bankAddress = row["bank address"] || "";
        const ifsc = row["bank ifsc code"] || row["ifsc"] || "";
        const accountNo = row["bank account no."] || row["bank account no"] || "";
        const iban = row["iban no."] || row["iban"] || "";
        const swift = row["swift code"] || row["swift"] || "";

        const bankDetails: any = {};
        if (bankName) bankDetails.bankName = bankName;
        if (bankBranch) bankDetails.branchName = bankBranch;
        if (bankAddress) bankDetails.bankAddress = bankAddress;
        if (ifsc) bankDetails.ifsc = ifsc;
        if (accountNo) bankDetails.accountNo = accountNo;
        if (iban) bankDetails.iban = iban;
        if (swift) bankDetails.swift = swift;

        const found = existingMap.get(nameLower);

        if (!found) {
          // Create new company
          const compId = `comp-${Math.random().toString(36).slice(2, 8)}`;
          const newDoc = {
            id: compId,
            name,
            nameLower,
            address: address || "",
            city: city || "",
            email: email || "",
            phone: phone || "",
            bankDetails: Object.keys(bankDetails).length ? bankDetails : {},
            totalBills: 0,
            totalPendingAmount: 0,
            autoRemindersEnabled: true,
            createdAt: serverTimestamp(),
          };
          batch.set(doc(db, "companies", compId), newDoc);
          created++;
        } else {
          // Update only non-empty fields, do not overwrite totals
          const compRef = doc(db, "companies", found.id);
          const updateObj: any = {};
          if (address) updateObj.address = address;
          if (city) updateObj.city = city;
          if (email) updateObj.email = email;
          if (phone) updateObj.phone = phone;

          // Merge bankDetails carefully
          if (Object.keys(bankDetails).length) {
            const existingBank = (found.bankDetails && typeof found.bankDetails === "object") ? found.bankDetails : {};
            updateObj.bankDetails = {
              ...existingBank,
              ...bankDetails,
            };
          }

          if (Object.keys(updateObj).length) {
            updateObj.updatedAt = serverTimestamp();
            batch.update(compRef, updateObj);
            updated++;
          }
        }
      }

      await batch.commit();

      // record a bulk_uploads entry
      await addDoc(collection(db, "bulk_uploads"), {
        collectionName: "companies",
        uploadedAt: new Date().toISOString(),
        totalRecords: keyed.length,
        created,
        updated,
      });

      toast.success(`✅ Companies processed. Created: ${created}, Updated: ${updated}`);
      onUpload(keyed as any[], "companies");
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error("Company upload failed:", err);
      toast.error(err.message || "Failed to upload companies");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Upload className="h-6 w-6" />
              <span>Bulk Upload Companies</span>
            </h2>
            <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                <ol className="text-sm text-blue-800 list-decimal list-inside">
                  <li>Upload the Excel file with company master data (columns: Name, Address, City, Contact No., E-Mail & Website, Bank Name, Bank Branch name, Bank Address, Bank IFSC Code, Bank Account No., IBAN No., SWIFT Code).</li>
                  <li>Existing companies are matched by lowercased name.</li>
                  <li>If a column cell is empty for an existing company, that field will NOT be overwritten.</li>
                  <li>Bank fields are stored under <code>bankDetails</code> only when provided.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-comp" />
            <label htmlFor="file-upload-comp" className="cursor-pointer flex flex-col items-center space-y-4">
              <div className="bg-gray-100 p-4 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-gray-600" />
              </div>
              {file ? (
                <>
                  <p className="text-lg font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-800">Click to select file</p>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop here</p>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end space-x-3 border-t border-gray-200">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg" disabled={isProcessing}>Cancel</button>
          <button onClick={handleUpload} disabled={!file || isProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
            {isProcessing ? "Processing..." : "Upload Companies"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadCompaniesModal;
