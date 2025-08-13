import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LogOut,
  Plus,
  Edit,
  Trash2,
  Download,
  ChevronLeft,
  UserRound,
  CalendarDays,
  FileSpreadsheet,
  Play,
  ShieldCheck,
  User,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  Users,
  Search,
  Filter,
  MoreVertical
} from "lucide-react";
import InstallButton from "./InstallButton";

/**
 * Installment Tracker Frontend (Single-file React)
 * - Enhanced UI with mobile card view and desktop table view
 * - Stunning gradients and modern design
 * - Avatar generation from user names
 * - Responsive design with Tailwind
 */

const API_BASE = "https://auth-tracking.onrender.com"; // change if backend runs elsewhere

// ========================
// API Client (unchanged)
// ========================
const api = axios.create({ baseURL: API_BASE });

function getToken() {
  return localStorage.getItem("authToken") || "";
}
function setToken(t) {
  if (t) localStorage.setItem("authToken", t);
  else localStorage.removeItem("authToken");
}
function clearToken() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("adminInfo");
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Helper for downloading protected endpoints with auth header
async function downloadFile(url, params = {}, filename = "report.xlsx") {
  const res = await api.get(url, { params, responseType: "blob" });
  const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

// ========================
// Avatar Component
// ========================
const Avatar = ({ firstName, secondName, size = "w-12 h-12", textSize = "text-lg" }) => {
  const initials = `${firstName?.charAt(0) || ''}${secondName?.charAt(0) || ''}`.toUpperCase();
  const colors = [
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-green-500 to-teal-500',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-cyan-500 to-blue-500',
    'bg-gradient-to-br from-teal-500 to-green-500'
  ];
  const colorIndex = (firstName?.charCodeAt(0) || 0) % colors.length;

  return (
    <div className={`${size} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold ${textSize} shadow-lg border-2 border-white/20`}>
      {initials}
    </div>
  );
};

// ========================
// Enhanced UI Primitives
// ========================
const Button = ({ as: Comp = "button", className = "", children, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-md hover:shadow-lg border border-gray-200/50",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
  };

  return (
    <Comp
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
};

const SecondaryButton = ({ className = "", children, ...props }) => (
  <Button variant="secondary" className={className} {...props}>{children}</Button>
);

const DangerButton = ({ className = "", children, ...props }) => (
  <Button variant="danger" className={className} {...props}>{children}</Button>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
    {...props}
  />
);

const Select = ({ className = "", children, ...props }) => (
  <select
    className={`w-full rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Label = ({ children }) => (
  <label className="text-sm font-semibold text-gray-700 mb-2 block">{children}</label>
);

const Card = ({ className = "", children, hover = false }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 ${hover ? 'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Dark backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-[95%] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-hidden">
        <Card className="p-4 sm:p-6 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200/50">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="py-4 sm:py-6 overflow-y-auto max-h-[55vh] sm:max-h-[60vh]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};


const Snackbar = ({ message, type = "success", onClose }) => {
  if (!message) return null;
  const colors = {
    success: "bg-gradient-to-r from-green-500 to-emerald-500",
    error: "bg-gradient-to-r from-red-500 to-rose-500",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500"
  };

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[320px] max-w-[90vw] rounded-2xl px-6 py-4 text-white shadow-2xl border border-white/20 ${colors[type]}`}>
      <div className="flex items-center justify-between gap-6">
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="text-white/90 hover:text-white transition-colors">Close</button>
      </div>
    </div>
  );
};

// ========================
// Login Page
// ========================
function LoginPage({ onLoggedIn, setSnack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setToken(data.token);
      // store admin info optionally
      if (data.admin) localStorage.setItem("adminInfo", JSON.stringify(data.admin));
      setSnack({ type: "success", message: "Logged in successfully" });
      onLoggedIn();
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Login failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Purple Glow */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 bg-purple-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>

        {/* Blue Glow */}
        <div className="absolute bottom-1/4 right-1/4 w-52 h-52 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-blue-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>

        {/* Indigo Glow */}
        <div className="absolute top-1/2 left-1/2 w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-500"></div>
      </div>


      <Card className="w-full max-w-[95%] sm:max-w-md p-6 sm:p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 sm:mb-4">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            Installment Tracker
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Admin Portal</p>
        </div>

        {/* Form */}
        <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                <ShieldCheck size={18} className="sm:size-20" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </Card>

    </div>
  );
}

// ========================
// User List Page
// ========================
function UserListPage({ onLogout, onOpenUser, setSnack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [accountTypeFilter, setAccountTypeFilter] = useState(""); // "" means all
  const [viewMode, setViewMode] = useState("card"); // card or table

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      const { data } = await api.get("/api/users", {
        params: {
          accountType: accountTypeFilter || undefined, // send only if set
          search: searchTerm || undefined
        }
      });
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [accountTypeFilter]);

  // Manual search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  async function handleDelete(u) {
    if (!confirm(`Delete user ${u.firstName}? This will remove all installments too.`)) return;
    try {
      await api.delete(`/api/users/${u._id}`);
      setSnack({ type: "success", message: "User deleted" });
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Delete failed" });
    }
  }

  const filteredUsers = users.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.secondName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobileNumber?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header with Gradient Background */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-white/90 via-blue-50/80 to-indigo-50/80 backdrop-blur-lg border-b border-white/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-lg">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
               Tracker App
                </h1>
                
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setReportOpen(true)}
              className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 flex items-center text-xs sm:text-sm"
            >
              <Download className="mr-1 sm:mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Report</span>
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center text-xs sm:text-sm"
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Add User</span>
            </button>
            <button
              onClick={() => { clearToken(); onLogout(); }}
              className="group bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 flex items-center text-xs sm:text-sm"
            >
              <LogOut className="mr-1 sm:mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Enhanced Container with Beautiful Background */}
        <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-xl shadow-2xl p-4 md:p-6 lg:p-8 text-gray-900 border border-blue-200/60 w-full mx-auto backdrop-blur-sm">
          
          {/* Enhanced Header Section */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-8 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200 pb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">All Users</h2>
              <p className="text-gray-600 text-sm md:text-base">Manage and track user accounts</p>
            </div>
            
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users by name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center space-x-3">
                <label htmlFor="accountTypeFilter" className="text-gray-700 font-semibold whitespace-nowrap">
                  Sort users by:
                </label>
                <select
                  id="accountTypeFilter"
                  value={accountTypeFilter}
                  onChange={(e) => setAccountTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm min-w-[140px]"
                >
                  <option value="">All Types</option>
                  <option value="First Slot">First Slot</option>
                  <option value="Second Slot">Second Slot</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced Loading State */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-8">
              {/* Quantum Dot Dance Animation */}
              <div className="relative flex items-center justify-center h-20 w-64">
                {/* Ripple Background Effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 opacity-10 animate-pulse"></div>
                </div>

                {/* 5 Dancing Dots */}
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#A05195'].map((color, i) => (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full opacity-90 animate-bounce"
                    style={{
                      backgroundColor: color,
                      left: `${20 + i * 15}%`,
                      animationDelay: `${i * 0.1}s`,
                      filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.1))',
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-gray-700 font-semibold">Loading users...</p>
                <p className="text-gray-500 text-sm">Please wait a moment</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            /* Enhanced Empty State */
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {searchTerm ? "No users found" : "No users yet"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search terms" : "Create your first user to get started"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setAddOpen(true)}
                      className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center"
                    >
                      <Plus className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                      Add First User
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Enhanced Cards Container */
            <div className="space-y-6">
              {/* Mobile Stats Cards - Only show on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-bold">{filteredUsers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active</p>
                      <p className="text-2xl font-bold">{filteredUsers.length}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-400 rounded-full flex items-center justify-center">
                      <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredUsers.map((u, index) => (
                  <div
                    key={u._id}
                    className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl border border-blue-200/40 p-6 group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer backdrop-blur-sm"
                    onClick={() => onOpenUser(u)}
                  >
                    {/* User Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {u.firstName.charAt(0)}{u.secondName?.charAt(0) || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {u.firstName} {u.secondName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Phone size={14} />
                          <span className="font-mono">{u.mobileNumber}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">User #{index + 1}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditUser(u); }}
                          className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-yellow-500 hover:to-orange-600 text-white rounded-lg shadow-sm transition-all duration-200 hover:scale-110"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                          className="p-2 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Building size={16} className="text-blue-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Account Type</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{u.accountType || "N/A"}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Monthly</span>
                        </div>
                        <p className="font-bold text-green-600 text-sm">₹{u.monthlyAmount?.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Paid Count Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">Paid Count</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">{u.paidCount || 0}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                      <div className="flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        <span>Tap to view details</span>
                        <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 shadow-sm">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals - unchanged functionality */}
      <UserFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(newUser) => { setUsers([newUser, ...users]); setAddOpen(false); setSnack({ type: "success", message: "User created" }); }}
      />

      <UserFormModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={(updated) => {
          setUsers((prev) => prev.map((x) => x._id === updated._id ? updated : x));
          setEditUser(null);
          setSnack({ type: "success", message: "User updated" });
        }}
      />

      <MonthlyReportModal open={reportOpen} onClose={() => setReportOpen(false)} setSnack={setSnack} />
    </div>
  );
}
// ========================
// User Details Page
// ========================
function UserDetailsPage({ user, onBack, setSnack }) {
  const [details, setDetails] = useState(user);
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState([]);
  const [editInst, setEditInst] = useState(null);

  async function refreshUser() {
    try {
      const { data } = await api.get(`/api/users/${user._id}`);
      setDetails(data);
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Failed to load user" });
    }
  }

  async function loadInstallments() {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/users/${user._id}/installments`);
      setInstallments(Array.isArray(data) ? data : (data?.installments || []));
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Failed to load installments" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshUser(); loadInstallments(); }, [user._id]);

  async function handleGenerate() {
    try {
      await api.post(`/api/users/${user._id}/generate-installments`);
      setSnack({ type: "success", message: "Installments generated" });
      loadInstallments();
      refreshUser();
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Generation failed" });
    }
  }

  async function downloadFullReport() {
    try {
      const name = `${details?.firstName || 'User'}_${details?._id}_FullReport.xlsx`;
      await downloadFile(`/api/users/${user._id}/report`, {}, name);
      setSnack({ type: "success", message: "Report downloaded" });
    } catch (err) {
      setSnack({ type: "error", message: "Download failed" });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header - Made responsive */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onBack}
              className="p-1 sm:p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <Avatar firstName={details.firstName} secondName={details.secondName} size="w-10 h-10 sm:w-12 sm:h-12" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {details.firstName} {details.secondName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">User Details & Installments</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SecondaryButton onClick={handleGenerate} className="text-xs sm:text-sm">
              <Play size={16} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Generate</span>
            </SecondaryButton>
            <Button onClick={downloadFullReport} className="text-xs sm:text-sm">
              <FileSpreadsheet size={16} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Full Report</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 sm:space-y-8">
        {/* User Profile Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar
                firstName={details.firstName}
                secondName={details.secondName}
                size="w-16 h-16 sm:w-20 sm:h-20"
                textSize="text-xl sm:text-2xl"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-3xl font-bold mb-2">{details.firstName} {details.secondName}</h2>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm sm:text-base text-white/90">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="sm:w-4 sm:h-4" />
                    <span>{details.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={14} className="sm:w-4 sm:h-4" />
                    <span>{details.accountType || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="sm:w-4 sm:h-4" />
                    <span>Since {details.accountOpenDate}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex justify-center items-center gap-4">
                <div className="text-white/80 text-xs sm:text-sm">Remaining Investment</div>
                <div className="text-xl sm:text-3xl font-bold">₹{details.leftInvestmentAmount}</div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Account Numbers */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-2 bg-blue-200 rounded-lg">
                    <CreditCard size={16} className="sm:w-5 sm:h-5 text-blue-700" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-blue-800">Account Numbers</span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Primary</div>
                    <div className="font-semibold text-sm">{details.accountNumber1 || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Secondary</div>
                    <div className="font-semibold text-sm">{details.accountNumber2 || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* CIF Numbers */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-2 bg-green-200 rounded-lg">
                    <User size={16} className="sm:w-5 sm:h-5 text-green-700" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-green-800">CIF Numbers</span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Primary</div>
                    <div className="font-semibold text-sm">{details.cifNumber1 || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Secondary</div>
                    <div className="font-semibold text-sm">{details.cifNumber2 || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-2 bg-purple-200 rounded-lg">
                    <DollarSign size={16} className="sm:w-5 sm:h-5 text-purple-700" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-purple-800">Investment</span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Monthly Amount</div>
                    <div className="font-semibold text-sm">₹{details.monthlyAmount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Total Amount</div>
                    <div className="font-semibold text-sm">₹{details.totalInvestmentAmount}</div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1 sm:p-2 bg-orange-200 rounded-lg">
                    <TrendingUp size={16} className="sm:w-5 sm:h-5 text-orange-700" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-orange-800">Details</span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Nominee</div>
                    <div className="font-semibold text-sm">{details.nomineeName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-medium">Maturity</div>
                    <div className="font-semibold text-sm">₹{details.maturityAmount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Installments Section */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1 sm:p-2 bg-blue-200 rounded-lg">
                  <CalendarDays size={18} className="sm:w-5 sm:h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Installments</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{installments.length} total installments</p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4">
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-600">Paid</div>
                  <div className="font-bold text-sm sm:text-base text-green-600">
                    {installments.filter(i => i.paid).length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-gray-600">Pending</div>
                  <div className="font-bold text-sm sm:text-base text-red-600">
                    {installments.filter(i => !i.paid).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
            </div>
          ) : installments.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <CalendarDays className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1 sm:mb-2">No Installments Yet</h3>
              <p className="text-sm text-gray-500 mb-4 sm:mb-6">Generate installments to get started</p>
              <Button onClick={handleGenerate} className="text-sm sm:text-base">
                <Play size={16} className="sm:w-5 sm:h-5" /> Generate Installments
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {installments.map((inst, idx) => (
                    <Card key={inst._id} className="p-3 sm:p-4" hover>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm sm:text-base">{inst.month} {inst.year}</div>
                            <div className="text-xs sm:text-sm text-gray-500">₹{inst.amount}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${inst.paid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}>
                            {inst.paid ? "Paid" : "Pending"}
                          </span>
                          <button
                            onClick={() => setEditInst(inst)}
                            className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <div className="font-medium">{new Date(inst.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Updated:</span>
                          <div className="font-medium">{new Date(inst.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">#</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Month</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Year</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Created</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Updated</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst, idx) => (
                        <tr key={inst._id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="p-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="p-4 font-medium">{inst.month}</td>
                          <td className="p-4 font-medium">{inst.year}</td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-800">₹{inst.amount}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${inst.paid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                              }`}>
                              {inst.paid ? "Paid" : "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(inst.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(inst.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end">
                              <button
                                onClick={() => setEditInst(inst)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Installment"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>

      {/* Edit installment modal */}
      <InstallmentModal
        open={!!editInst}
        installment={editInst}
        onClose={() => setEditInst(null)}
        onSaved={(updated) => {
          setInstallments((prev) => prev.map((x) => x._id === updated._id ? updated : x));
          setEditInst(null);
          setDetails((d) => ({ ...d }));
          setSnack({ type: "success", message: "Installment updated" });
        }}
      />
    </div>
  );
}

// ========================
// Modals
// ========================
const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

function MonthlyReportModal({ open, onClose, setSnack }) {
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      await downloadFile(`/api/reports/installments`, { month, year }, `Installments_${month}_${year}.xlsx`);
      setSnack({ type: "success", message: "Report downloaded" });
      onClose();
    } catch (e) {
      setSnack({ type: "error", message: "Download failed" });
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Download Monthly Report" footer={
      <>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <Button onClick={handleDownload} disabled={loading}>
          <Download size={18} /> {loading ? "Preparing..." : "Download"}
        </Button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Select Month</Label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div>
          <Label>Select Year</Label>
          <Input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function UserFormModal({ open, onClose, onSaved, user }) {
  const isEdit = !!user;
  const [form, setForm] = useState(() => user || {
    firstName: "",
    secondName: "",
    accountNumber1: "",
    accountNumber2: "",
    cifNumber1: "",
    cifNumber2: "",
    mobileNumber: "",
    nomineeName: "",
    monthlyAmount: 0,
    totalInvestmentAmount: 0,
    leftInvestmentAmount: 0,
    maturityAmount: 0,
    accountType: "",
    accountOpenDate: "",
    accountCloseDate: "",
  });

  useEffect(() => {
    setForm(user || {
      firstName: "",
      secondName: "",
      accountNumber1: "",
      accountNumber2: "",
      cifNumber1: "",
      cifNumber2: "",
      mobileNumber: "",
      nomineeName: "",
      monthlyAmount: 0,
      totalInvestmentAmount: 0,
      leftInvestmentAmount: 0,
      maturityAmount: 0,
      accountType: "",
      accountOpenDate: "",
      accountCloseDate: "",
    });
  }, [user]);

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    try {
      const payload = {
        ...form,
        monthlyAmount: +form.monthlyAmount,
        totalInvestmentAmount: +form.totalInvestmentAmount,
        leftInvestmentAmount: +form.leftInvestmentAmount,
        maturityAmount: +form.maturityAmount
      };
      if (isEdit) {
        const { data } = await api.put(`/api/users/${user._id}`, payload);
        onSaved?.(data);
      } else {
        const { data } = await api.post(`/api/users`, payload);
        onSaved?.(data);
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Save failed");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {isEdit && <Avatar firstName={form.firstName} secondName={form.secondName} size="w-8 h-8" textSize="text-sm" />}
          <span>{isEdit ? "Edit User" : "Add New User"}</span>
        </div>
      }
      footer={
        <>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <Button onClick={handleSave}>
            <SaveIcon /> {isEdit ? "Update User" : "Create User"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="col-span-full">
          <h4 className="font-semibold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-2">Personal Information</h4>
        </div>

        <div>
          <Label>First Name *</Label>
          <Input value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} placeholder="Enter first name" />
        </div>
        <div>
          <Label>Second Name</Label>
          <Input value={form.secondName || ""} onChange={(e) => upd("secondName", e.target.value)} placeholder="Enter second name" />
        </div>
        <div>
          <Label>Mobile Number *</Label>
          <Input value={form.mobileNumber} onChange={(e) => upd("mobileNumber", e.target.value)} placeholder="Enter mobile number" />
        </div>
        <div>
          <Label>Nominee Name</Label>
          <Input value={form.nomineeName} onChange={(e) => upd("nomineeName", e.target.value)} placeholder="Enter nominee name" />
        </div>

        {/* Account Information */}
        <div className="col-span-full mt-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-2">Account Information</h4>
        </div>

        <div>
          <Label>Account Number 1</Label>
          <Input value={form.accountNumber1} onChange={(e) => upd("accountNumber1", e.target.value)} placeholder="Primary account number" />
        </div>
        <div>
          <Label>Account Number 2</Label>
          <Input value={form.accountNumber2 || ""} onChange={(e) => upd("accountNumber2", e.target.value)} placeholder="Secondary account number" />
        </div>
        <div>
          <Label>CIF Number 1</Label>
          <Input value={form.cifNumber1} onChange={(e) => upd("cifNumber1", e.target.value)} placeholder="Primary CIF number" />
        </div>
        <div>
          <Label>CIF Number 2</Label>
          <Input value={form.cifNumber2 || ""} onChange={(e) => upd("cifNumber2", e.target.value)} placeholder="Secondary CIF number" />
        </div>
        <div>
          <Label>Account Type</Label>
          <Select value={form.accountType || ""} onChange={(e) => upd("accountType", e.target.value)}>
            <option value="">Select account type</option>
            <option>First Slot</option>
            <option>Second Slot</option>
          </Select>
        </div>

        {/* Investment Information */}
        <div className="col-span-full mt-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-2">Investment Information</h4>
        </div>

        <div>
          <Label>Monthly Amount (₹) *</Label>
          <Input type="number" value={form.monthlyAmount} onChange={(e) => upd("monthlyAmount", e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Total Investment Amount (₹) *</Label>
          <Input type="number" value={form.totalInvestmentAmount} onChange={(e) => upd("totalInvestmentAmount", e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Maturity Amount (₹)</Label>
          <Input type="number" value={form.maturityAmount} onChange={(e) => upd("maturityAmount", e.target.value)} placeholder="0" />
        </div>

        {/* Date Information */}
        <div className="col-span-full mt-6">
          <h4 className="font-semibold text-lg mb-4 text-gray-800 border-b border-gray-200 pb-2">Account Dates</h4>
        </div>

        <div>
          <Label>Account Open Date</Label>
          <Input type="date" value={form.accountOpenDate} onChange={(e) => upd("accountOpenDate", e.target.value)} />
        </div>
        <div>
          <Label>Account Close Date</Label>
          <Input type="date" value={form.accountCloseDate} onChange={(e) => upd("accountCloseDate", e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function InstallmentModal({ open, onClose, onSaved, installment }) {
  const [form, setForm] = useState(installment || {});
  useEffect(() => setForm(installment || {}), [installment]);
  if (!installment) return null;

  async function save() {
    try {
      const payload = { amount: +form.amount, paid: !!form.paid };
      const { data } = await api.put(`/api/installments/${installment._id}`, payload);
      onSaved?.(data);
    } catch (e) {
      alert(e?.response?.data?.error || "Update failed");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <CalendarDays className="text-white" size={20} />
          </div>
          <span>Edit {installment.month} {installment.year}</span>
        </div>
      }
      footer={
        <>
         
          <Button onClick={save}>
            <SaveIcon /> Update Installment
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            value={form.amount ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Enter amount"
          />
        </div>
        <div>
          <Label>Payment Status</Label>
          <Select
            value={form.paid ? "true" : "false"}
            onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value === "true" }))}
          >
            <option value="false">Pending</option>
            <option value="true">Paid</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
    <path d="M7 21h10a2 2 0 0 0 2-2V7.5L16.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2" />
    <path d="M7 3v8h8" />
  </svg>
);

// ========================
// App Root
// ========================
export default function App() {
  const [view, setView] = useState("auth"); // auth | list | details
  const [selected, setSelected] = useState(null);
  const [snack, setSnack] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (getToken()) setView("list");
  }, []);

  function showSnack({ message, type = "success" }) {
    setSnack({ message, type });
    setTimeout(() => setSnack({ message: "", type }), 4000);
  }

  return (
    <div className="font-sans antialiased">
      {view === "auth" && (
        <LoginPage onLoggedIn={() => setView("list")} setSnack={showSnack} />
      )}
      {view === "list" && (
        <UserListPage
          onLogout={() => setView("auth")}
          onOpenUser={(u) => { setSelected(u); setView("details"); }}
          setSnack={showSnack}
        />
      )}
      {view === "details" && selected && (
        <UserDetailsPage user={selected} onBack={() => setView("list")} setSnack={showSnack} />
      )}
      <InstallButton />
      <Snackbar message={snack.message} type={snack.type} onClose={() => setSnack({ message: "", type: snack.type })} />
    </div>
  );
}