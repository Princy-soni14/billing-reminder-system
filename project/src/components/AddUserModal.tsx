import { useState, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { X, Loader2 } from "lucide-react";
// 🚀 FIXED: Explicit import path with .tsx extension
import { useAuth } from "../contexts/AuthContext.tsx";

// 🚀 FIXED: Simplified environment check to satisfy the build tool
const API_BASE_URL = import.meta.env.MODE === 'production' ? "" : "http://localhost:5174";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Your Custom Spinner Component
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const AddUserModal = ({ isOpen, onClose }: AddUserModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ Get the real logged-in user
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to perform this action.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Get a FRESH token (Force refresh to avoid 401 errors)
      const token = await user.getIdToken(true);
      console.log("Sending fresh token...");

      // 2. Call the Backend API
      const response = await fetch(`${API_BASE_URL}/api/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // ✅ Strict Bearer format
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      // Handle response
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Fallback for non-JSON errors (like Vercel 500s)
        const text = await response.text();
        throw new Error(`Server Error: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      // 3. Success!
      setSuccess(`User "${data.email}" created successfully!`);
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");

      // Close after a short delay so user sees the success message
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setError(null);
      }, 2000);

    } catch (err: any) {
      console.error("Create User Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create an account for a new user and assign them a role.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Set Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "admin")}
              required
              className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm border focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="user">User (Company Login)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-32 justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? <Spinner /> : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};