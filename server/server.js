// // server.js
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// const ExcelJS = require('exceljs');

// // ----------------------------------------
// // Setup
// // ----------------------------------------
// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use(helmet());
// app.use(morgan('dev'));

// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
// app.use(limiter);

// const {
//   PORT = 4000,
//   MONGO_URI,
//   JWT_SECRET,
//   ADMIN_EMAIL,
//   ADMIN_PASSWORD,
// } = process.env;

// if (!MONGO_URI || !JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
//   console.error('❌ Missing required .env values.');
//   process.exit(1);
// }

// // ----------------------------------------
// // DB
// // ----------------------------------------
// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch((err) => {
//     console.error('❌ Mongo connection error:', err);
//     process.exit(1);
//   });

// // ----------------------------------------
// // Schemas & Models
// // ----------------------------------------
// const userSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   secondName: String,
//   accountNumber1: { type: String, required: true },
//   accountNumber2: String,
//   cifNumber1: { type: String, required: true },
//   cifNumber2: String,
//   mobileNumber: { type: String, required: true },
//   nomineeName: { type: String, required: true },
//   monthlyAmount: { type: Number, required: true },
//   totalInvestmentAmount: { type: Number, required: true },
//   leftInvestmentAmount: { type: Number, required: true },
//   maturityAmount: { type: Number, required: true },
//   accountType: { type: String },
//   accountOpenDate: { type: String, required: true },  // Expecting "YYYY-MM-DD"
//   accountCloseDate: { type: String, required: true }, // Expecting "YYYY-MM-DD"
// }, { timestamps: true });

// const installmentSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   month: String,           // e.g., "January"
//   year: Number,            // e.g., 2025
//   amount: { type: Number, default: 0 },
//   paid: { type: Boolean, default: false }
// }, { timestamps: true });

// installmentSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// const User = mongoose.model('User', userSchema);
// const Installment = mongoose.model('Installment', installmentSchema);

// // ----------------------------------------
// // Utilities
// // ----------------------------------------
// const MONTH_NAMES = [
//   'January','February','March','April','May','June',
//   'July','August','September','October','November','December'
// ];

// function parseDateStr(yyyy_mm_dd) {
//   // Safe parse "YYYY-MM-DD"
//   const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
//   return new Date(y, (m - 1), d || 1);
// }

// function* monthsBetweenInclusive(start, end) {
//   // Yield {monthName, year} from start to end inclusive.
//   // Normalize to first of month to avoid DST/rollovers
//   const cur = new Date(start.getFullYear(), start.getMonth(), 1);
//   const endNorm = new Date(end.getFullYear(), end.getMonth(), 1);
//   while (cur <= endNorm) {
//     yield { monthName: MONTH_NAMES[cur.getMonth()], year: cur.getFullYear() };
//     cur.setMonth(cur.getMonth() + 1);
//   }
// }

// async function recalcLeftInvestmentAmount(userId) {
//   // leftInvestmentAmount = totalInvestmentAmount - sum(paid installments amounts)
//   const user = await User.findById(userId);
//   if (!user) return;
//   const paidAgg = await Installment.aggregate([
//     { $match: { userId: user._id, paid: true } },
//     { $group: { _id: null, total: { $sum: '$amount' } } }
//   ]);
//   const paidTotal = paidAgg.length ? paidAgg[0].total : 0;
//   const left = Math.max(0, (user.totalInvestmentAmount || 0) - paidTotal);
//   user.leftInvestmentAmount = left;
//   await user.save();
//   return left;
// }

// // ----------------------------------------
// // Auth (simple env-based admin account)
// // ----------------------------------------
// function authMiddleware(req, res, next) {
//   const header = req.headers.authorization || '';
//   const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//   if (!token) return res.status(401).json({ error: 'Missing token' });
//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     req.admin = payload; // { email, role }
//     next();
//   } catch (e) {
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }
// }

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password } = req.body || {};
//     if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
//       const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
//       return res.json({ token });
//     }
//     return res.status(401).json({ error: 'Invalid credentials' });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ error: 'Login failed' });
//   }
// });

// // ----------------------------------------
// // Users
// // ----------------------------------------
// app.post('/api/users', authMiddleware, async (req, res) => {
//   try {
//     const u = await User.create(req.body);
//     return res.status(201).json(u);
//   } catch (e) {
//     if (e.code === 11000) return res.status(409).json({ error: 'Duplicate key' });
//     return res.status(400).json({ error: e.message });
//   }
// });

// app.get('/api/users', authMiddleware, async (req, res) => {
//   try {
//     const users = await User.find().sort({ createdAt: -1 });
//     return res.json(users);
//   } catch (e) {
//     return res.status(500).json({ error: 'Failed to fetch users' });
//   }
// });

// app.get('/api/users/:id', authMiddleware, async (req, res) => {
//   try {
//     const u = await User.findById(req.params.id);
//     if (!u) return res.status(404).json({ error: 'User not found' });
//     return res.json(u);
//   } catch (e) {
//     return res.status(400).json({ error: 'Invalid user id' });
//   }
// });

// app.put('/api/users/:id', authMiddleware, async (req, res) => {
//   try {
//     const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!u) return res.status(404).json({ error: 'User not found' });
//     return res.json(u);
//   } catch (e) {
//     return res.status(400).json({ error: e.message });
//   }
// });

// app.delete('/api/users/:id', authMiddleware, async (req, res) => {
//   try {
//     const u = await User.findByIdAndDelete(req.params.id);
//     if (!u) return res.status(404).json({ error: 'User not found' });
//     await Installment.deleteMany({ userId: u._id });
//     return res.json({ success: true });
//   } catch (e) {
//     return res.status(400).json({ error: 'Invalid user id' });
//   }
// });

// // ----------------------------------------
// // Generate Monthly Installments for a User (between open & close)
// // ----------------------------------------
// app.post('/api/users/:userId/generate-installments', authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     const start = parseDateStr(user.accountOpenDate);
//     const end = parseDateStr(user.accountCloseDate);
//     if (isNaN(start) || isNaN(end) || start > end) {
//       return res.status(400).json({ error: 'Invalid open/close dates' });
//     }

//     const toInsert = [];
//     for (const { monthName, year } of monthsBetweenInclusive(start, end)) {
//       toInsert.push({
//         userId: user._id,
//         month: monthName,
//         year,
//         amount: user.monthlyAmount,
//         paid: false,
//       });
//     }

//     // Insert while skipping duplicates thanks to unique index
//     const results = [];
//     for (const inst of toInsert) {
//       try {
//         const r = await Installment.create(inst);
//         results.push(r);
//       } catch (e) {
//         if (e.code === 11000) {
//           // Duplicate -> skip silently
//         } else {
//           throw e;
//         }
//       }
//     }

//     return res.json({ created: results.length });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ error: 'Failed generating installments' });
//   }
// });

// // ----------------------------------------
// // Get all installments for a user (optional month/year filter)
// // ----------------------------------------
// app.get('/api/users/:userId/installments', authMiddleware, async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     const q = { userId: req.params.userId };
//     if (month) q.month = month;
//     if (year) q.year = Number(year);

//     const data = await Installment.find(q).sort({ year: 1, month: 1 });
//     return res.json(data);
//   } catch (e) {
//     return res.status(400).json({ error: e.message });
//   }
// });

// // ----------------------------------------
// // Update an installment by ID
// // ----------------------------------------
// app.put('/api/installments/:id', authMiddleware, async (req, res) => {
//   try {
//     const inst = await Installment.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!inst) return res.status(404).json({ error: 'Installment not found' });
//     // Recalculate user's leftInvestmentAmount when installment changes
//     await recalcLeftInvestmentAmount(inst.userId);
//     return res.json(inst);
//   } catch (e) {
//     return res.status(400).json({ error: e.message });
//   }
// });

// // ----------------------------------------
// // Excel helpers
// // ----------------------------------------
// function commonSheetStyle(ws) {
//   // Center all columns/cells
//   ws.columns.forEach((col) => {
//     col.alignment = { vertical: 'middle', horizontal: 'center' };
//     col.width = Math.max(col.width || 15, 15);
//   });

//   // Apply header style (first row assumed header)
//   const headerRow = ws.getRow(1);
//   headerRow.font = { bold: true };
//   headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
//   headerRow.height = 22;
//   headerRow.eachCell((cell) => {
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFEEEEEE' },
//     };
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       bottom: { style: 'thin' },
//       right: { style: 'thin' },
//     };
//   });

//   ws.views = [{ state: 'frozen', ySplit: 1 }];
// }

// function addTableBorders(ws, fromRow, toRow) {
//   for (let r = fromRow; r <= toRow; r++) {
//     const row = ws.getRow(r);
//     row.eachCell((cell) => {
//       cell.border = {
//         top: { style: 'thin' },
//         left: { style: 'thin' },
//         bottom: { style: 'thin' },
//         right: { style: 'thin' },
//       };
//     });
//   }
// }

// // ----------------------------------------
// // Download monthly Excel for ALL users (by month/year)
// // ----------------------------------------
// app.get('/api/reports/installments', authMiddleware, async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     if (!month || !year) {
//       return res.status(400).json({ error: 'Provide ?month=January&year=2025' });
//     }

//     const y = Number(year);
//     const records = await Installment.find({ month, year: y })
//       .populate('userId')
//       .sort({ 'userId.firstName': 1 });

//     const wb = new ExcelJS.Workbook();
//     const ws = wb.addWorksheet(`Report ${month}-${year}`);

//     ws.addRow([
//       '#',
//       'User Name',
//       'Mobile',
//       'Account Type',
//       'Month',
//       'Year',
//       'Amount',
//       'Paid',
//       'Paid On',
//       'Account No. 1',
//       'CIF No. 1',
//     ]);

//     let idx = 1;
//     let totalAmount = 0;
//     let totalPaid = 0;

//     for (const r of records) {
//       const u = r.userId;
//       const paidOn = r.paid ? new Date(r.updatedAt).toLocaleDateString() : '';
//       ws.addRow([
//         idx++,
//         `${u.firstName || ''} ${u.secondName || ''}`.trim(),
//         u.mobileNumber || '',
//         u.accountType || '',
//         r.month,
//         r.year,
//         r.amount,
//         r.paid ? 'Yes' : 'No',
//         paidOn,
//         u.accountNumber1 || '',
//         u.cifNumber1 || '',
//       ]);
//       totalAmount += r.amount || 0;
//       if (r.paid) totalPaid += r.amount || 0;
//     }

//     // Totals row
//     const totalsRow = ws.addRow([
//       '', 'Totals', '', '', '', '',
//       totalAmount, `Collected: ${totalPaid}`, '', '', ''
//     ]);
//     totalsRow.font = { bold: true };

//     commonSheetStyle(ws);
//     addTableBorders(ws, 1, ws.lastRow.number);

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename="Installments_${month}_${year}.xlsx"`);

//     await wb.xlsx.write(res);
//     res.end();
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ error: 'Failed to generate report' });
//   }
// });

// // ----------------------------------------
// // Download FULL Excel report for a single user (all installments)
// // ----------------------------------------
// app.get('/api/users/:userId/report', authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     const installments = await Installment.find({ userId: user._id })
//       .sort({ year: 1, month: 1 });

//     const paidTotal = installments.filter(i => i.paid).reduce((a, b) => a + (b.amount || 0), 0);
//     const left = Math.max(0, (user.totalInvestmentAmount || 0) - paidTotal);

//     const wb = new ExcelJS.Workbook();
//     const ws = wb.addWorksheet('User Report');

//     // Header block (merged & centered)
//     ws.mergeCells('A1', 'H1'); ws.getCell('A1').value = 'User Details';
//     ws.getCell('A1').font = { bold: true, size: 14 };
//     ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
//     ws.getRow(1).height = 24;

//     ws.addRow([]);
//     ws.addRow(['Name', `${user.firstName || ''} ${user.secondName || ''}`.trim(),
//                'Mobile', user.mobileNumber || '',
//                'Account Type', user.accountType || '',
//                'Nominee', user.nomineeName || '']);
//     ws.addRow(['Account No.1', user.accountNumber1 || '',
//                'CIF No.1', user.cifNumber1 || '',
//                'Monthly Amount', user.monthlyAmount || 0,
//                'Maturity Amount', user.maturityAmount || 0]);
//     ws.addRow(['Account No.2', user.accountNumber2 || '',
//                'CIF No.2', user.cifNumber2 || '',
//                'Open Date', user.accountOpenDate,
//                'Close Date', user.accountCloseDate]);

//     // Spacer
//     ws.addRow([]);
//     // Table header
//     ws.addRow(['#','Month','Year','Amount','Paid','Created On','Updated On']);

//     let startTableRow = ws.lastRow.number;
//     let idx = 1;
//     installments.forEach(inst => {
//       ws.addRow([
//         idx++,
//         inst.month,
//         inst.year,
//         inst.amount,
//         inst.paid ? 'Yes' : 'No',
//         new Date(inst.createdAt).toLocaleDateString(),
//         new Date(inst.updatedAt).toLocaleDateString(),
//       ]);
//     });

//     // Summary section
//     ws.addRow([]);
//     ws.addRow(['Total Investment', user.totalInvestmentAmount || 0,
//                'Paid Total', paidTotal,
//                'Left Amount', left,
//                '', '']);
//     const summaryRow = ws.lastRow;
//     summaryRow.font = { bold: true };

//     // Styling
//     // Make a reasonable set of columns
//     ws.columns = [
//       { key: 'c1', width: 10 }, // #
//       { key: 'c2', width: 16 }, // Month
//       { key: 'c3', width: 10 }, // Year
//       { key: 'c4', width: 14 }, // Amount
//       { key: 'c5', width: 12 }, // Paid
//       { key: 'c6', width: 16 }, // Created
//       { key: 'c7', width: 16 }, // Updated
//       { key: 'c8', width: 16 },
//     ];

//     // Center everything
//     ws.eachRow((row) => {
//       row.alignment = { vertical: 'middle', horizontal: 'center' };
//     });

//     // Add borders to the detail table (header + rows)
//     const headerRowIdx = startTableRow;        // header
//     const lastRowIdx = ws.lastRow.number - 2;  // before summary blank & summary
//     addTableBorders(ws, headerRowIdx, lastRowIdx);

//     // Header style for the detail table header row
//     const headerRow = ws.getRow(headerRowIdx);
//     headerRow.font = { bold: true };
//     headerRow.height = 22;
//     headerRow.eachCell((cell) => {
//       cell.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FFEEEEEE' },
//       };
//     });

//     // Freeze top area until the table header
//     ws.views = [{ state: 'frozen', ySplit: headerRowIdx }];

//     // Response headers
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     const safeName = `${user.firstName || 'User'}_${user._id}`.replace(/\s+/g, '');
//     res.setHeader('Content-Disposition', `attachment; filename="${safeName}_FullReport.xlsx"`);

//     await wb.xlsx.write(res);
//     res.end();
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ error: 'Failed to generate user report' });
//   }
// });

// // ----------------------------------------
// // Start
// // ----------------------------------------
// app.get('/', (_req, res) => res.send('Installment Tracker API is running 🚀'));
// app.listen(PORT, () => console.log(`✅ Server listening on http://localhost:${PORT}`));

// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');

// ----------------------------------------
// Setup
// ----------------------------------------
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

const {
  PORT = 4000,
  MONGO_URI,
  JWT_SECRET,
} = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('❌ Missing required .env values (MONGO_URI, JWT_SECRET).');
  process.exit(1);
}

// ----------------------------------------
// DB
// ----------------------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  });

// ----------------------------------------
// Hardcoded Admins (scalable array)
// Keep plaintext passwords here for easy sharing (dev only).
// ----------------------------------------
const ADMINS_RAW = [
  { id: 'admin1', name: 'Super Admin', email: 'admin1@example.com', password: 'password123' },
  { id: 'admin2', name: 'Finance Admin', email: 'admin2@example.com', password: 'securepass' },
  // Add more admins here as needed:
  // { id: 'admin3', name: 'Bob', email: 'bob@example.com', password: 'bobspass' },
];

// Build hashed version used for auth
const ADMINS = ADMINS_RAW.map(a => ({
  id: a.id,
  name: a.name,
  email: a.email.toLowerCase().trim(),
  passwordHash: bcrypt.hashSync(a.password, 10),
}));

// Print admin credentials at startup (so you can copy/share the plain passwords)
console.log('🔐 Hardcoded admin credentials (for local/dev use):');
ADMINS_RAW.forEach(a => {
  console.log(`  ${a.email}  ->  ${a.password}`);
});
console.log('---');

// ----------------------------------------
// Schemas & Models
// (kept the same as your working version)
// ----------------------------------------
const userSchema = new mongoose.Schema({
  adminId: { type: String, required: true }, // who created/owns this user
  firstName: { type: String, required: true },
  secondName: String,
  accountNumber1: { type: String, required: true },
  accountNumber2: String,
  cifNumber1: { type: String, required: true },
  cifNumber2: String,
  mobileNumber: { type: String, required: true },
  nomineeName: { type: String, required: true },
  monthlyAmount: { type: Number, required: true },
  totalInvestmentAmount: { type: Number, required: true },
  leftInvestmentAmount: { type: Number, required: true },
  maturityAmount: { type: Number, required: true },
  accountType: { type: String },
  accountOpenDate: { type: String, required: true },  // Expecting "YYYY-MM-DD" or "DD-MM-YYYY"
  accountCloseDate: { type: String, required: true }, // Expecting "YYYY-MM-DD" or "DD-MM-YYYY"
}, { timestamps: true });

const installmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: String,
  year: Number,
  amount: { type: Number, default: 0 },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

installmentSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Installment = mongoose.model('Installment', installmentSchema);

// ----------------------------------------
// Utilities (same implementations)
// ----------------------------------------
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const MONTH_INDEX = MONTH_NAMES.reduce((acc, m, i) => (acc[m] = i, acc), {});

function parseDateFlexible(s) {
  if (!s || typeof s !== 'string') return new Date('');
  const parts = s.split(/[-/]/).map(Number);
  if (parts.length !== 3) return new Date('');
  const [a, b, c] = parts;
  if (String(a).length === 4) return new Date(a, (b - 1), c || 1); // YYYY-MM-DD
  if (String(c).length === 4) return new Date(c, (b - 1), a || 1); // DD-MM-YYYY
  return new Date('');
}

function* monthsBetweenInclusive(start, end) {
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endNorm = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endNorm) {
    yield { monthName: MONTH_NAMES[cur.getMonth()], year: cur.getFullYear() };
    cur.setMonth(cur.getMonth() + 1);
  }
}

async function recalcLeftInvestmentAmount(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  const paidAgg = await Installment.aggregate([
    { $match: { userId: user._id, paid: true } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const paidTotal = paidAgg.length ? paidAgg[0].total : 0;
  const left = Math.max(0, (user.totalInvestmentAmount || 0) - paidTotal);
  user.leftInvestmentAmount = left;
  await user.save();
  return left;
}

async function assertUserOwnedByAdmin(userId, adminId) {
  const u = await User.findById(userId);
  if (!u) return null;
  if (u.adminId !== adminId) return null;
  return u;
}

// ----------------------------------------
// Auth middleware & login route (fixed)
// ----------------------------------------
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET); // payload: { adminId, email, iat, exp }
    req.admin = payload;      // preserve payload under req.admin
    req.adminId = payload.adminId; // convenience
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Provide email and password' });

    // Normalize email and find admin (case-insensitive)
    const emailNorm = String(email).toLowerCase().trim();
    const admin = ADMINS.find(a => a.email === emailNorm);

    if (!admin) {
      console.warn(`Login failed - admin not found for email: ${emailNorm}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      console.warn(`Login failed - wrong password for admin: ${emailNorm}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// small debug endpoint to list admin ids & emails (remove in production)
app.get('/api/debug/admins', (_req, res) => {
  res.json(ADMINS.map(a => ({ id: a.id, email: a.email })));
});

// ----------------------------------------
// (All other routes unchanged — copied from your working file)
// Users, generate-installments, installments, reports...
// I'll include them verbatim so the server is complete
// ----------------------------------------

// Users
app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body, adminId: req.adminId };
    const u = await User.create(data);
    return res.status(201).json(u);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Duplicate key' });
    return res.status(400).json({ error: e.message });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ adminId: req.adminId }).sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const u = await assertUserOwnedByAdmin(req.params.id, req.adminId);
    if (!u) return res.status(404).json({ error: 'User not found' });
    return res.json(u);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const u = await assertUserOwnedByAdmin(req.params.id, req.adminId);
    if (!u) return res.status(404).json({ error: 'User not found' });
    Object.assign(u, req.body || {});
    await u.save();
    return res.json(u);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const u = await assertUserOwnedByAdmin(req.params.id, req.adminId);
    if (!u) return res.status(404).json({ error: 'User not found' });
    await Installment.deleteMany({ userId: u._id });
    await u.deleteOne();
    return res.json({ success: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
});

// Generate installments
app.post('/api/users/:userId/generate-installments', authMiddleware, async (req, res) => {
  try {
    const user = await assertUserOwnedByAdmin(req.params.userId, req.adminId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const start = parseDateFlexible(user.accountOpenDate);
    const end = parseDateFlexible(user.accountCloseDate);
    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ error: 'Invalid open/close dates' });
    }

    const ops = [];
    for (const { monthName, year } of monthsBetweenInclusive(start, end)) {
      ops.push({
        updateOne: {
          filter: { userId: user._id, month: monthName, year },
          update: { $setOnInsert: { userId: user._id, month: monthName, year, amount: user.monthlyAmount, paid: false } },
          upsert: true,
        }
      });
    }
    if (ops.length) {
      await Installment.bulkWrite(ops, { ordered: false });
    }

    const count = await Installment.countDocuments({ userId: user._id });
    return res.json({ message: 'Installments ensured for range', totalForUser: count });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed generating installments' });
  }
});

// Get installments for a user
app.get('/api/users/:userId/installments', authMiddleware, async (req, res) => {
  try {
    const user = await assertUserOwnedByAdmin(req.params.userId, req.adminId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { month, year } = req.query;
    const q = { userId: user._id };
    if (month) q.month = month;
    if (year) q.year = Number(year);

    const data = await Installment.find(q).lean();
    data.sort((a, b) => (a.year - b.year) || (MONTH_INDEX[a.month] - MONTH_INDEX[b.month]));
    return res.json(data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Update installment
app.put('/api/installments/:id', authMiddleware, async (req, res) => {
  try {
    const inst = await Installment.findById(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Installment not found' });

    const user = await User.findById(inst.userId);
    if (!user || user.adminId !== req.adminId) {
      return res.status(404).json({ error: 'Installment not found' });
    }

    if (typeof req.body.amount === 'number') inst.amount = req.body.amount;
    if (typeof req.body.paid === 'boolean') inst.paid = req.body.paid;
    await inst.save();

    await recalcLeftInvestmentAmount(inst.userId);
    return res.json(inst);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Excel helpers & report endpoints (unchanged from your previous version)
// Monthly report across admin's users
app.get('/api/reports/installments', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Provide ?month=August&year=2025' });
    }
    const y = Number(year);
    const users = await User.find({ adminId: req.adminId }).select('_id firstName secondName mobileNumber accountType accountNumber1 cifNumber1');
    const userIdSet = new Set(users.map(u => String(u._id)));

    const records = await Installment.find({ month, year: y }).populate('userId').lean();
    const myRecords = records.filter(r => r.userId && userIdSet.has(String(r.userId._id)));
    myRecords.sort((a, b) => (a.userId.firstName || '').localeCompare(b.userId.firstName || ''));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Report ${month}-${year}`);

    ws.addRow([
      '#','User Name','Mobile','Account Type','Month','Year','Amount','Paid','Paid On','Account No. 1','CIF No. 1'
    ]);

    let idx = 1;
    let totalAmount = 0;
    let totalPaid = 0;

    for (const r of myRecords) {
      const u = r.userId || {};
      const paidOn = r.paid ? new Date(r.updatedAt).toLocaleDateString() : '';
      ws.addRow([
        idx++,
        `${u.firstName || ''} ${u.secondName || ''}`.trim(),
        u.mobileNumber || '',
        u.accountType || '',
        r.month,
        r.year,
        r.amount || 0,
        r.paid ? 'Yes' : 'No',
        paidOn,
        u.accountNumber1 || '',
        u.cifNumber1 || '',
      ]);
      totalAmount += r.amount || 0;
      if (r.paid) totalPaid += r.amount || 0;
    }

    const totalsRow = ws.addRow(['','Totals','','','','', totalAmount, `Collected: ${totalPaid}`, '', '', '']);
    totalsRow.font = { bold: true };

    // Basic styling
    ws.columns.forEach((col) => { col.alignment = { vertical: 'middle', horizontal: 'center' }; col.width = Math.max(col.width || 15, 15); });
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).height = 22;
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Installments_${month}_${year}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Full user report
app.get('/api/users/:userId/report', authMiddleware, async (req, res) => {
  try {
    const user = await assertUserOwnedByAdmin(req.params.userId, req.adminId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const installments = await Installment.find({ userId: user._id }).lean();
    installments.sort((a, b) => (a.year - b.year) || (MONTH_INDEX[a.month] - MONTH_INDEX[b.month]));

    const paidTotal = installments.filter(i => i.paid).reduce((a, b) => a + (b.amount || 0), 0);
    const left = Math.max(0, (user.totalInvestmentAmount || 0) - paidTotal);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('User Report');

    ws.mergeCells('A1', 'H1'); ws.getCell('A1').value = 'User Details';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 24;

    ws.addRow([]);
    ws.addRow(['Name', `${user.firstName || ''} ${user.secondName || ''}`.trim(),
               'Mobile', user.mobileNumber || '',
               'Account Type', user.accountType || '',
               'Nominee', user.nomineeName || '']);
    ws.addRow(['Account No.1', user.accountNumber1 || '',
               'CIF No.1', user.cifNumber1 || '',
               'Monthly Amount', user.monthlyAmount || 0,
               'Maturity Amount', user.maturityAmount || 0]);
    ws.addRow(['Account No.2', user.accountNumber2 || '',
               'CIF No.2', user.cifNumber2 || '',
               'Open Date', user.accountOpenDate,
               'Close Date', user.accountCloseDate]);

    ws.addRow([]);
    ws.addRow(['#','Month','Year','Amount','Paid','Created On','Updated On']);
    const headerRowIdx = ws.lastRow.number;

    let idx = 1;
    for (const inst of installments) {
      ws.addRow([
        idx++,
        inst.month,
        inst.year,
        inst.amount || 0,
        inst.paid ? 'Yes' : 'No',
        new Date(inst.createdAt).toLocaleDateString(),
        new Date(inst.updatedAt).toLocaleDateString(),
      ]);
    }

    ws.addRow([]);
    const paidRow = ws.addRow(['Total Investment', user.totalInvestmentAmount || 0, 'Paid Total', paidTotal, 'Left Amount', left, '', '']);
    paidRow.font = { bold: true };

    ws.columns = [
      { width: 10 },{ width: 16 },{ width: 10 },{ width: 14 },{ width: 12 },{ width: 16 },{ width: 16 },{ width: 16 }
    ];
    ws.eachRow((row) => { row.alignment = { vertical: 'middle', horizontal: 'center' }; });

    const lastRowIdx = ws.lastRow.number - 2;
    for (let r = headerRowIdx; r <= lastRowIdx; r++) {
      ws.getRow(r).eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    }

    const headerRow = ws.getRow(headerRowIdx);
    headerRow.font = { bold: true };
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    });

    ws.views = [{ state: 'frozen', ySplit: headerRowIdx }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const safeName = `${user.firstName || 'User'}_${user._id}`.replace(/\s+/g, '');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_FullReport.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to generate user report' });
  }
});

// ----------------------------------------
// Start
// ----------------------------------------
app.get('/', (_req, res) => res.send('Installment Tracker API is running 🚀'));
app.listen(PORT, () => console.log(`✅ Server listening on http://localhost:${PORT}`));

