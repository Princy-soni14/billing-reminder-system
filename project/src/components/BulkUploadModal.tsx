import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, getDocs,getDoc, doc, setDoc, addDoc } from "firebase/firestore";
import {
  generateBillsTemplateCSV,
  generateCompaniesTemplateCSV,
} from "../utils/csvExport";

// 🧠 Dynamic column mapping dictionary
const COLUMN_MAPPING: Record<string, string> = {
  // Common variations
  "company name": "name",
  name: "name",
  company: "name",

  email: "email",
  "email address": "email",
  "e-mail": "email",

  phone: "phone",
  "phone number": "phone",
  contact: "phone",
  mobile: "phone",
  "contact no.": "phone",

  address: "address",
  "company address": "address",

  city: "city",
  town: "city",

  state: "state",
  province: "state",

  pincode: "pincode",
  "postal code": "pincode",
  zip: "pincode",
  zipcode: "pincode",

  "contact person": "contactPerson",
  gst: "gstNumber",
  gstin: "gstNumber",
  "gst number": "gstNumber",
  "gst no": "gstNumber",

  // Bills-specific
  "bill no": "billNo",
  "invoice no": "billNo",
  "company id": "companyId",
  "bill date (dd/mm/yyyy)": "date",
  "bill date": "date",
  "po no": "poNo",
  type: "type",
  "bill amount": "billAmount",
  "pending amount": "pendingAmount",
  "balance amount": "balanceAmount",
  "due days": "dueDays",
};

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[], type: "bills" | "companies") => void;
  type: "bills" | "companies";
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  type,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { role, companyId } = useAuth();

  if (!isOpen) return null;

  // ---------------------------
  // Template download
  // ---------------------------
  const handleDownloadTemplate = () => {
    if (type === "bills") generateBillsTemplateCSV();
    else generateCompaniesTemplateCSV();
    toast.success("Template downloaded successfully!");
  };

  // ---------------------------
  // File select
  // ---------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedExt = [
      ".csv",
      ".xlsx",
      ".xls",
      ".xlsm",
      ".xlsb",
      ".ods",
    ];
    const name = selected.name.toLowerCase();
    const isValid = allowedExt.some((ext) => name.endsWith(ext));
    if (!isValid) {
      toast.error("Unsupported file format. Please upload Excel or CSV.");
      return;
    }

    setFile(selected);
  };

  // ---------------------------
  // Parse ANY spreadsheet
  // ---------------------------
  const parseFile = async (): Promise<any[]> => {
    if (!file) return [];

    const name = file.name.toLowerCase();

    // Excel formats
    if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsm") ||
      name.endsWith(".xlsb") ||
      name.endsWith(".ods")
    ) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws, { defval: "" });
    }

    // CSV
    if (name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
      const delimiter = text.includes(";") ? ";" : ",";
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line
          .split(delimiter)
          .map((v) => v.trim().replace(/"/g, ""));
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = values[i]));
        return obj;
      });
      return rows;
    }

    throw new Error("Unsupported file format");
  };

  // ---------------------------
  // Dynamic header mapping
  // ---------------------------
  const mapHeaders = (row: Record<string, any>): Record<string, any> => {
    const mapped: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const norm = key.toLowerCase().trim();
      const dbField = COLUMN_MAPPING[norm];
      if (dbField) mapped[dbField] = row[key];
    }
    return mapped;
  };

  // ---------------------------
  // Firestore Upload
  // ---------------------------
  
  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file to upload");
    setIsProcessing(true);

    try {
      const rows = await parseFile();
      if (rows.length === 0) throw new Error("No data found");

      // Map all rows dynamically
      const mappedData = rows.map(mapHeaders);

      // Get count for sequential IDs
     // Get count for sequential IDs
const snap = await getDocs(collection(db, type));
let counter = snap.size + 1;

// ✅ Fetch the company data if the user is not admin
let currentCompany: any = null;
if (role === "user" && companyId) {
  const ref = doc(db, "companies", companyId);
  const companySnap = await getDoc(ref);
  if (companySnap.exists()) currentCompany = companySnap.data();
}



// 🔽 Inside handleUpload() function:
for (const record of mappedData) {
  const id =
    type === "bills"
      ? `bill-${String(counter).padStart(3, "0")}`
      : `comp-${String(counter).padStart(3, "0")}`;
  counter++;

  if (type === "bills") {
    // ✅ Auto-map company based on who’s logged in
    const finalCompanyId = role === "admin" ? record.companyId : companyId;
    const finalCompanyName =
      role === "admin"
        ? record.companyName || ""
        : currentCompany?.name || "";

    await setDoc(doc(db, "bills", id), {
      ...record,
      id,
      billNoLower: (record.billNo || "").toLowerCase(),
      companyId: finalCompanyId,
      companyName: finalCompanyName,
      isReminderPaused: false,
      reminderCount: 0,
      lastReminderSent: "",
      uploadedAt: new Date().toISOString(),
    });
  } else {
    await setDoc(doc(db, "companies", id), {
      ...record,
      id,
      nameLower: (record.name || "").toLowerCase(),
      totalPendingAmount: 0,
      autoRemindersEnabled: true,
      createdAt: new Date().toISOString(),
    });
  }
}


      await addDoc(collection(db, "bulk_uploads"), {
  collectionName: type,
  uploadedAt: new Date().toISOString(),
  totalRecords: mappedData.length,
  records: mappedData, // ✅ required by Firestore rule for company users
});


      onUpload(mappedData, type);
      toast.success(`✅ Uploaded ${mappedData.length} ${type}!`);
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error("❌ Upload failed:", err);
      toast.error(err.message || "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Upload className="h-6 w-6" />
              <span>
                Bulk Upload {type === "bills" ? "Bills" : "Companies"}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Instructions
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in your data (any header names allowed)</li>
                  <li>Upload Excel or CSV file</li>
                  <li>System will auto-map headers dynamically</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-lg font-medium"
            >
              <Download className="h-5 w-5" />
              <span>Download Template</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.xlsb,.ods"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <div className="bg-gray-100 p-4 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-gray-600" />
              </div>
              {file ? (
                <>
                  <p className="text-lg font-medium text-gray-800">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-800">
                    Click to select file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or drag and drop here
                  </p>
                </>
              )}
            </label>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                File ready. Click “Upload” to start.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Upload to Firestore"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
