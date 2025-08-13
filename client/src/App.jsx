// src/App.jsx
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
  ShieldCheck
} from "lucide-react";

/**
 * Installment Tracker Frontend (Single-file React)
 * - Tailwind UI, axios API client
 * - Pages: Login, UserList, UserDetails
 * - Modals: Add/Edit User, Update Installment, Monthly Report Download
 * - Snackbars for feedback
 *
 * API_BASE: set to your backend URL
 */

const API_BASE = "http://localhost:4000"; // change if backend runs elsewhere

// ========================
// API Client
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
// UI Primitives
// ========================
const Button = ({ as:Comp = "button", className = "", children, ...props }) => (
  <Comp
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-medium shadow-sm border border-transparent hover:shadow transition active:scale-[0.98] bg-blue-600 text-white ${className}`}
    {...props}
  >
    {children}
  </Comp>
);

const SecondaryButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-medium border bg-white text-gray-700 hover:bg-gray-50 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </button>
);

const DangerButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-medium border border-red-200 bg-red-600 text-white hover:bg-red-700 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

const Select = ({ className = "", children, ...props }) => (
  <select
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Label = ({ children }) => (
  <label className="text-sm font-semibold text-gray-700 mb-1 block">{children}</label>
);

const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4">
        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
          </div>
          <div className="py-4">{children}</div>
          {footer && <div className="pt-3 border-t flex justify-end gap-2">{footer}</div>}
        </Card>
      </div>
    </div>
  );
};

const Snackbar = ({ message, type = "success", onClose }) => {
  if (!message) return null;
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 min-w-[280px] max-w-[90vw] rounded-xl px-4 py-3 text-white shadow-lg ${
      type === "error" ? "bg-red-600" : type === "warning" ? "bg-yellow-600" : "bg-green-600"
    }`}>
      <div className="flex items-center justify-between gap-6">
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="text-white/90">Close</button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-blue-600" />
          <h1 className="text-2xl font-bold">Installment Tracker - Admin</h1>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
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

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      const { data } = await api.get("/api/users");
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (err) {
      setSnack({ type: "error", message: err?.response?.data?.error || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound />
            <h2 className="font-bold text-lg">Users</h2>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => setReportOpen(true)}><Download size={18}/> Monthly Report</SecondaryButton>
            <Button onClick={() => setAddOpen(true)}><Plus size={18}/> Add User</Button>
            <DangerButton onClick={() => { clearToken(); onLogout(); }}><LogOut size={18}/> Logout</DangerButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <Card className="p-8 text-center text-gray-600">No users yet. Click "Add User" to create one.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(users) && users.map((u) => (
              <Card key={u._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{u.firstName} {u.secondName}</h3>
                    <p className="text-sm text-gray-500">Mobile: {u.mobileNumber}</p>
                    <p className="text-sm text-gray-500">Type: {u.accountType || "-"}</p>
                    <p className="text-sm text-gray-500">Monthly: ₹{u.monthlyAmount}</p>
                    <p className="text-sm text-gray-500">Left: <span className="font-semibold text-blue-600">₹{u.leftInvestmentAmount}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <SecondaryButton onClick={() => setEditUser(u)} title="Edit"><Edit size={16}/></SecondaryButton>
                    <DangerButton onClick={() => handleDelete(u)} title="Delete"><Trash2 size={16}/></DangerButton>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => onOpenUser(u)}><CalendarDays size={18}/> Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add User Modal */}
      <UserFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(newUser) => { setUsers([newUser, ...users]); setAddOpen(false); setSnack({ type: "success", message: "User created" }); }}
      />

      {/* Edit User Modal */}
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

      {/* Monthly Report Modal */}
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft/></button>
            <h2 className="font-bold text-lg">User Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={handleGenerate}><Play size={18}/> Generate Installments</SecondaryButton>
            <Button onClick={downloadFullReport}><FileSpreadsheet size={18}/> Full Report</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* User Summary */}
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-semibold">{details.firstName} {details.secondName}</p></div>
            <div><p className="text-gray-500">Mobile</p><p className="font-semibold">{details.mobileNumber}</p></div>
            <div><p className="text-gray-500">Account Type</p><p className="font-semibold">{details.accountType || '-'}</p></div>
            <div><p className="text-gray-500">Monthly</p><p className="font-semibold">₹{details.monthlyAmount}</p></div>
            <div><p className="text-gray-500">Total</p><p className="font-semibold">₹{details.totalInvestmentAmount}</p></div>
            <div><p className="text-gray-500">Left</p><p className="font-semibold text-blue-600">₹{details.leftInvestmentAmount}</p></div>
            <div><p className="text-gray-500">Open</p><p className="font-semibold">{details.accountOpenDate}</p></div>
            <div><p className="text-gray-500">Close</p><p className="font-semibold">{details.accountCloseDate}</p></div>
          </div>
        </Card>

        {/* Installments */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Installments ({installments.length})</h3>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Year</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Updated</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((i, idx) => (
                    <tr key={i._id} className="border-t">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 text-center">{i.month}</td>
                      <td className="px-3 py-2 text-center">{i.year}</td>
                      <td className="px-3 py-2 text-center">₹{i.amount}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${i.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {i.paid ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{new Date(i.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-center">{new Date(i.updatedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        <SecondaryButton onClick={() => setEditInst(i)}><Edit size={16}/> Edit</SecondaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          // refresh user details after an installment change
          setDetails((d) => ({ ...d })); // triggers re-render
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
  "January","February","March","April","May","June","July","August","September","October","November","December"
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
        <Button onClick={handleDownload} disabled={loading}><Download size={18}/> {loading ? "Preparing..." : "Download"}</Button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Month</Label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div>
          <Label>Year</Label>
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
      const payload = { ...form, monthlyAmount: +form.monthlyAmount, totalInvestmentAmount: +form.totalInvestmentAmount, leftInvestmentAmount: +form.leftInvestmentAmount, maturityAmount: +form.maturityAmount };
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit User" : "Add User"} footer={
      <>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <Button onClick={handleSave}><SaveIcon/> {isEdit ? "Update" : "Create"}</Button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
        <div>
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} />
        </div>
        <div>
          <Label>Second Name</Label>
          <Input value={form.secondName || ""} onChange={(e) => upd("secondName", e.target.value)} />
        </div>
        <div>
          <Label>Mobile Number</Label>
          <Input value={form.mobileNumber} onChange={(e) => upd("mobileNumber", e.target.value)} />
        </div>
        <div>
          <Label>Nominee Name</Label>
          <Input value={form.nomineeName} onChange={(e) => upd("nomineeName", e.target.value)} />
        </div>
        <div>
          <Label>Account Number 1</Label>
          <Input value={form.accountNumber1} onChange={(e) => upd("accountNumber1", e.target.value)} />
        </div>
        <div>
          <Label>Account Number 2</Label>
          <Input value={form.accountNumber2 || ""} onChange={(e) => upd("accountNumber2", e.target.value)} />
        </div>
        <div>
          <Label>CIF Number 1</Label>
          <Input value={form.cifNumber1} onChange={(e) => upd("cifNumber1", e.target.value)} />
        </div>
        <div>
          <Label>CIF Number 2</Label>
          <Input value={form.cifNumber2 || ""} onChange={(e) => upd("cifNumber2", e.target.value)} />
        </div>
        <div>
          <Label>Account Type</Label>
          <Select value={form.accountType || ""} onChange={(e) => upd("accountType", e.target.value)}>
            <option value="">Select</option>
            <option>Before 15 days</option>
            <option>After 15 days</option>
          </Select>
        </div>
        <div>
          <Label>Monthly Amount (₹)</Label>
          <Input type="number" value={form.monthlyAmount} onChange={(e) => upd("monthlyAmount", e.target.value)} />
        </div>
        <div>
          <Label>Total Investment Amount (₹)</Label>
          <Input type="number" value={form.totalInvestmentAmount} onChange={(e) => upd("totalInvestmentAmount", e.target.value)} />
        </div>
        <div>
          <Label>Left Investment Amount (₹)</Label>
          <Input type="number" value={form.leftInvestmentAmount} onChange={(e) => upd("leftInvestmentAmount", e.target.value)} />
        </div>
        <div>
          <Label>Maturity Amount (₹)</Label>
          <Input type="number" value={form.maturityAmount} onChange={(e) => upd("maturityAmount", e.target.value)} />
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
    <Modal open={open} onClose={onClose} title={`Edit ${installment.month} ${installment.year}`} footer={
      <>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <Button onClick={save}><SaveIcon/> Update</Button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Amount (₹)</Label>
          <Input type="number" value={form.amount ?? 0} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        </div>
        <div>
          <Label>Paid</Label>
          <Select value={form.paid ? "true" : "false"} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value === "true" }))}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M7 21h10a2 2 0 0 0 2-2V7.5L16.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2"/><path d="M7 3v8h8"/></svg>
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
    setTimeout(() => setSnack({ message: "", type }), 3000);
  }

  return (
    <div className="font-sans">
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

      <Snackbar message={snack.message} type={snack.type} onClose={() => setSnack({ message: "", type: snack.type })} />
    </div>
  );
}
