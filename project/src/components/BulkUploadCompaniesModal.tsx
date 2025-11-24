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
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// -----------------------
// Props
// -----------------------
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[], type: "bills" | "companies") => void;
}

// Normalize helper
const normalize = (s: any) =>
  s === undefined || s === null ? "" : String(s).trim();

// -----------------------
// PERFECT PARSER (Matches your real Excel format)
// -----------------------
const parseCompaniesExcel = async (file: File) => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];

  // Read all rows as 2D table
  const sheet = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
  }) as any[][];

  // Your header row is EXACTLY row index 4 (5th row)
  // BUT we auto-detect using 7+ matching columns
  const VALID_HEADERS = [
    "name",
    "address",
    "city",
    "contact no.",
    "e-mail & website",
    "gst no.",
    "pan no.",
    "bank name",
    "bank branch name",
    "bank address",
    "bank ifsc code",
    "bank account no.",
    "iban no.",
    "swift code",
  ];

  let headerRowIndex = -1;

  for (let i = 0; i < 15 && i < sheet.length; i++) {
    const row = sheet[i].map((c: any) => String(c).trim().toLowerCase());
    const matches = row.filter((cell) => VALID_HEADERS.includes(cell));
    if (matches.length >= 7) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1)
    throw new Error("Header row not found — invalid Excel format.");

  // Read sheet starting from detected header row
  const raw = XLSX.utils.sheet_to_json(ws, {
    header: sheet[headerRowIndex],
    defval: "",
    range: headerRowIndex + 1,
  }) as Record<string, any>[];

  // Normalize fields
  return raw
    .map((r) => {
      const keys = Object.keys(r);
      const m: any = {};
      keys.forEach((k) => {
        m[k.trim().toLowerCase()] = normalize(r[k]);
      });
      return m;
    })
    .filter((r) => r["name"] && r["name"] !== "");
};

// -----------------------
// MAIN COMPONENT
// -----------------------
const BulkUploadCompaniesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = [".xlsx", ".xls", ".csv"];
    if (!valid.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      toast.error("Please upload .xlsx, .xls or .csv");
      return;
    }
    setFile(f);
  };

  // -----------------------
  // HANDLE UPLOAD 
  // -----------------------
  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a file.");
    setIsProcessing(true);

    try {
      const parsed = await parseCompaniesExcel(file);
      if (!parsed.length) throw new Error("No rows found.");

      // Fetch existing companies to detect create/update
      const snap = await getDocs(collection(db, "companies"));
      const existing = new Map();

      snap.docs.forEach((d) => {
        const data = d.data();
        const nameLower = (data.nameLower || data.name || "")
          .toLowerCase()
          .trim();
        existing.set(nameLower, { id: d.id, ...data });
      });

      const batch = writeBatch(db);
      let created = 0;
      let updated = 0;

      for (const row of parsed) {
        const rawName =
          row["name"] ||
          row["company name"] ||
          row["company"] ||
          row["companyname"];
        const name = normalize(rawName);
        const nameLower = name.toLowerCase().trim();

        const address = row["address"] || "";
        const city = row["city"] || "";
        const phone =
          row["contact no."] ||
          row["contact no"] ||
          row["phone"] ||
          row["contact"] ||
          "";
        const email =
          row["e-mail & website"] ||
          row["email"] ||
          row["e-mail"] ||
          "";

        // BANK FIELDS
        const bankDetails: any = {};
        if (row["bank name"]) bankDetails.bankName = row["bank name"];
        if (row["bank branch name"])
          bankDetails.branchName = row["bank branch name"];
        if (row["bank address"]) bankDetails.bankAddress = row["bank address"];
        if (row["bank ifsc code"]) bankDetails.ifsc = row["bank ifsc code"];
        if (row["bank account no."])
          bankDetails.accountNo = row["bank account no."];
        if (row["iban no."]) bankDetails.iban = row["iban no."];
        if (row["swift code"]) bankDetails.swift = row["swift code"];

        const found = existing.get(nameLower);

        if (!found) {
          // ● CREATE NEW
          const compId = `comp-${Math.random().toString(36).slice(2, 8)}`;
          batch.set(doc(db, "companies", compId), {
            id: compId,
            name,
            nameLower,
            address,
            city,
            email,
            phone,
            bankDetails,
            totalBills: 0,
            totalPendingAmount: 0,
            autoRemindersEnabled: true,
            createdAt: serverTimestamp(),
          });
          created++;
        } else {
          // ● UPDATE EXISTING
          const updateObj: any = {};
          if (address) updateObj.address = address;
          if (city) updateObj.city = city;
          if (email) updateObj.email = email;
          if (phone) updateObj.phone = phone;

          if (Object.keys(bankDetails).length) {
            updateObj.bankDetails = {
              ...(found.bankDetails || {}),
              ...bankDetails,
            };
          }

          if (Object.keys(updateObj).length) {
            updateObj.updatedAt = serverTimestamp();
            batch.update(doc(db, "companies", found.id), updateObj);
            updated++;
          }
        }
      }

      await batch.commit();

      await addDoc(collection(db, "bulk_uploads"), {
        collectionName: "companies",
        uploadedAt: new Date().toISOString(),
        created,
        updated,
        totalRecords: parsed.length,
      });

      toast.success(`Uploaded successfully. Created: ${created}, Updated: ${updated}`);
      onUpload(parsed, "companies");
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload companies");
    } finally {
      setIsProcessing(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Bulk Upload Companies
            </h2>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Instructions
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc ml-5">
                <li>Upload the company master Excel file.</li>
                <li>Existing companies will be updated (only non-empty fields).</li>
                <li>New companies will be created automatically.</li>
                <li>All bank fields are merged safely.</li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload-company"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload-company"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="bg-gray-100 p-4 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-gray-600" />
              </div>

              {file ? (
                <>
                  <p className="text-lg font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-800">
                    Click to select file
                  </p>
                  <p className="text-sm text-gray-500">or drag & drop</p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
          >
            {isProcessing ? "Processing..." : "Upload Companies"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadCompaniesModal;
