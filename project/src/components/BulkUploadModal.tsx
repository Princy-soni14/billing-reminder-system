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
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import {
  generateBillsTemplateCSV,
  generateCompaniesTemplateCSV,
} from "../utils/csvExport";

// Header normalization mapping
const COLUMN_MAPPING: Record<string, string> = {
  "company name": "companyName",
  name: "companyName",
  company: "companyName",

  "bill no": "billNo",
  "invoice no": "billNo",
  "bill date": "date",
  "bill date (dd/mm/yyyy)": "date",

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
  const { role } = useAuth();

  if (!isOpen) return null;

  // ----------------------------------------
  // Download template
  // ----------------------------------------
  const handleDownloadTemplate = () => {
    if (type === "bills") generateBillsTemplateCSV();
    else generateCompaniesTemplateCSV();
    toast.success("Template downloaded successfully!");
  };

  // ----------------------------------------
  // Parse uploaded file
  // ----------------------------------------
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

const parseExcel = async (file: File) => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (!rows || rows.length === 0) throw new Error("Empty or unreadable file");

  // Convert Excel serial to JS date
  const excelDateToJSDate = (serial: number) => {
    const utc_days = Math.floor(serial - 25569);
    return new Date(utc_days * 86400 * 1000);
  };

  const normalizeCell = (c: any) => {
    if (typeof c === "number" && c > 40000 && c < 50000) {
      const dt = excelDateToJSDate(c);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    if (typeof c === "number") return c.toString();
    return String(c || "").replace(/[\u00A0]/g, " ").replace(/\s+/g, " ").trim();
  };
  
  // FIXED: Handles YYYY-MM-DD strings (from your CSV) and DD/MM/YYYY (from serial conversion)
  const looksLikeDate = (c: any) => {
    if (typeof c === "number" && c > 40000 && c < 50000) return true;
    const str = normalizeCell(c);
    return /^\d{2}\/\d{2}\/\d{4}$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str);
  };
  
  const looksLikeAmount = (c: any) => /DB|CR/i.test(normalizeCell(c));
  
  const parseAmt = (amt: any) =>
    parseFloat(normalizeCell(amt).replace(/[^0-9.]/g, "")) || 0;

  // Skip header rows
  let startIndex = 0;
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].join(" ").toLowerCase();
    if (text.includes("bill no") && (text.includes("due") || text.includes("bill amount"))) {
      startIndex = i + 1;
      break;
    }
  }

  // --- NEW PARSING LOGIC ---
  const result: any[] = [];
  let currentCompany = "";
  let pendingAddress: string[] = [];
  let bills: any[] = [];
  let inBillSection = false; // State to track if we are in a bill block

  const pushCompany = () => {
    if (currentCompany && bills.length > 0) {
      result.push({
        companyName: currentCompany.trim(),
        address: pendingAddress.join(" "),
        bills: [...bills],
      });
    }
    // Reset for next company
    currentCompany = "";
    pendingAddress = [];
    bills = [];
    inBillSection = false;
  };

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const first = normalizeCell(row[0]);
    if (!first) continue;

    const isBillLine = looksLikeDate(first) && row.some((c) => looksLikeAmount(c));

    if (isBillLine) {
      if (currentCompany) {
        // We are in a bill section
        inBillSection = true;

        const date = normalizeCell(row[0]);
        const billNo = normalizeCell(row[1]);
        const poNo = normalizeCell(row[2]);
        const type = normalizeCell(row[3]);
        const dueDays = parseInt(normalizeCell(row[4])) || 0;
        
        const billAmount = parseAmt(row[5]);
        const adjAmount = parseAmt(row[6]);
        const pendingAmount = parseAmt(row[7]) || billAmount;

        bills.push({
          date,
          billNo,
          poNo,
          type,
          dueDays,
          billAmount,
          adjAmount,
          pendingAmount,
        });
      }
      // else: bill line found before any company, ignore it
    } else {
      // Not a bill line, check if it's text
      // Updated regex to allow numbers (for phone/pincode) and quotes
      const isTextLine =
        !looksLikeAmount(first) &&
        first.length > 3 &&
        !/total|balance|report|date|due/i.test(first) &&
        /^[A-Za-z0-9\s\.\-&/(),"]+$/.test(first);

      if (isTextLine) {
        if (inBillSection) {
          // We were processing bills, and now we see text.
          // This MUST be a new company.
          pushCompany(); // Save the previous company
          currentCompany = first; // This is the new company name
        } else {
          // We are not in a bill section yet
          if (!currentCompany) {
            // This is the first line of text, so it's the company name
            currentCompany = first;
          } else {
            // We already have a company name, so this is an address line
            pendingAddress.push(first);
          }
        }
      }
    }
  }

  // Push the very last company
  pushCompany();

  if (result.length === 0) throw new Error("No company or bill sections detected");

  // Flatten bills for Firestore upload
  const flatBills: any[] = [];
  for (const comp of result) {
    for (const bill of comp.bills) {
      flatBills.push({
        ...bill,
        companyName: comp.companyName,
        address: comp.address,
      });
    }
  }

  console.log("✅ Parsed companies:", result.map((r) => r.companyName));
  console.log("✅ Total bills parsed:", flatBills.length);
  return flatBills;
};

  const normalizeHeaders = (row: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const norm = key.toLowerCase().trim();
      const dbKey = COLUMN_MAPPING[norm];
      if (dbKey) out[dbKey] = row[key];
    }
    return out;
  };

 // ----------------------------------------
  // Main Upload
  // ----------------------------------------
  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    setIsProcessing(true);

    // Helper to parse date strings (DD/MM/YYYY or YYYY-MM-DD)
    const parseBillDate = (dateStr: string): Date => {
      if (!dateStr) return new Date(); // Fallback to today

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // YYYY-MM-DD
        return new Date(dateStr);
      }
      
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        // DD/MM/YYYY
        const parts = dateStr.split("/");
        // new Date(year, monthIndex, day)
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    
      // Fallback for unparsed
      console.warn(`Could not parse date: ${dateStr}`);
      return new Date();
    };

    try {
      // 1. Get flat list of bills from the parser
      const flatBills = await parseExcel(file);
      if (flatBills.length === 0) throw new Error("No data found in file");

      // 2. Group flat bills by companyName
      const grouped: Record<string, any[]> = {};
      for (const row of flatBills) {
        const companyName = row.companyName;
        if (!companyName) continue; // Skip rows without a company
        
        if (!grouped[companyName]) {
          grouped[companyName] = [];
        }
        grouped[companyName].push(row);
      }

      const companyNames = Object.keys(grouped);
      if (companyNames.length === 0)
        throw new Error("No company sections detected");

      toast.success(`Detected ${companyNames.length} companies`);

      // 3. Fetch existing companies
      const existingSnap = await getDocs(collection(db, "companies"));
      const existingMap = new Map(
        existingSnap.docs.map((d) => [
          (d.data().name || "").trim().toLowerCase(),
          { id: d.id, ...d.data() }, // This will now include totalBills
        ])
      );

      // 4. Fetch all existing bills to prevent duplicates
      console.log("Fetching existing bills to prevent duplicates...");
      const billsSnap = await getDocs(collection(db, "bills"));
      const existingBillKeys = new Set<string>();
      billsSnap.docs.forEach((billDoc) => {
        const bill = billDoc.data();
        const key = `${bill.companyId}_${(bill.billNo || "").trim().toLowerCase()}`;
        existingBillKeys.add(key);
      });
      console.log(`Found ${existingBillKeys.size} existing bills in database.`);


      // Prepare batch operations
      const batch = writeBatch(db);
      let totalBillsAdded = 0; 
      let totalBillsSkipped = 0; 

      for (const name of companyNames) {
        const lower = name.toLowerCase().trim();
        let companyDoc = existingMap.get(lower) as
          | { id: string; name: string; totalPendingAmount?: number; totalBills?: number } // <-- UPDATED TYPE
          | undefined;

        // 🏢 Create company if not exists
        if (!companyDoc) {
          const compId = `comp-${Math.random().toString(36).slice(2, 8)}`;
          const sampleRow = grouped[name]?.[0] || {};
          const newCompanyDoc = {
            id: compId,
            name: name,
            nameLower: lower,
            address: sampleRow.address || "",
            totalPendingAmount: 0,
            totalBills: 0, // <-- NEW: Initialize bill count
            autoRemindersEnabled: true,
            createdAt: serverTimestamp(),
          };
          batch.set(doc(db, "companies", compId), newCompanyDoc);
          existingMap.set(lower, newCompanyDoc);
          companyDoc = newCompanyDoc;
        } else {
          // 🧠 Update address if missing
          const compRef = doc(db, "companies", companyDoc.id);
          if (!("address" in companyDoc) || !companyDoc.address) {
            if (grouped[name]?.[0]?.address) {
              batch.update(compRef, {
                address: grouped[name][0].address,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        const companyId = companyDoc!.id;
        const companyName = companyDoc!.name;
        
        let companyPendingTotalForNewBills = 0; 
        let companyTotalNewBills = 0; // <-- NEW: Counter for new bills *per company*

        for (const r of grouped[name]) {
          const billNo = (r.billNo || "").trim();
          const billNoLower = billNo.toLowerCase();

          // DUPLICATE CHECK
          const compositeKey = `${companyId}_${billNoLower}`;
          if (existingBillKeys.has(compositeKey)) {
            totalBillsSkipped++;
            continue; 
          }

          // Bill is new.
          const billId = `bill-${Math.random().toString(36).slice(2, 8)}`;

          // Calculate due date
          const billDate = parseBillDate(r.date);
          const dueDays = parseInt(r.dueDays) || 0;
          const dueDate = new Date(billDate.getTime());
          dueDate.setDate(dueDate.getDate() + dueDays);

          const billAmount = parseFloat(r.billAmount) || 0;
          const pendingAmount = parseFloat(r.pendingAmount) || billAmount;

          const billData = {
            id: billId,
            billNo,
            billNoLower,
            companyId,
            companyName,
            billAmount,
            pendingAmount,
            balanceAmount: pendingAmount,
            dueDays,
            dueDate: dueDate.toISOString(),
            date: r.date || "",
            poNo: r.poNo || "",
            type: r.type || "",
            isReminderPaused: false,
            reminderCount: 0,
            lastReminderSent: null,
            uploadedAt: new Date().toISOString(),
          };

          batch.set(doc(db, "bills", billId), billData);
          
          companyPendingTotalForNewBills += pendingAmount; 
          companyTotalNewBills++; // <-- NEW: Increment new bill counter
          totalBillsAdded++; 
        }

        // Update company totals *only if new bills were added*
        if (companyTotalNewBills > 0) {
          const compRef = doc(db, "companies", companyId);
          
          // Get existing values from the company doc we fetched
          const existingPending = companyDoc.totalPendingAmount || 0;
          const existingBills = companyDoc.totalBills || 0;

          batch.update(compRef, {
            totalPendingAmount: existingPending + companyPendingTotalForNewBills,
            totalBills: existingBills + companyTotalNewBills // <-- NEW: Update the total bill count
          });
        }
      }

      await batch.commit();

      // Add to bulk upload history
      await addDoc(collection(db, "bulk_uploads"), {
        collectionName: "bills",
        uploadedAt: new Date().toISOString(),
        totalRecords: totalBillsAdded, 
        totalCompanies: companyNames.length,
        totalRecordsSkipped: totalBillsSkipped, 
      });

      // Updated Success Message
      let successMessage = `✅ Uploaded ${totalBillsAdded} new bills for ${companyNames.length} companies.`;
      if (totalBillsSkipped > 0) {
        successMessage += ` Skipped ${totalBillsSkipped} duplicate bills.`;
      }
      toast.success(successMessage);
      
      onUpload(flatBills, "bills"); 
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err.message || "Failed to upload");
    } finally {
      setIsProcessing(false);
    }
  };
  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Upload className="h-6 w-6" />
              <span>Bulk Upload Bills</span>
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
                  <li>Upload the Excel file with companies and bills.</li>
                  <li>System auto-detects companies and bills under them.</li>
                  <li>New companies are created if missing.</li>
                  <li>Bill due dates auto-calculated from "Due Days".</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
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
