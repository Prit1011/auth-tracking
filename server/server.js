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
  { id: 'admin3', name: 'dharm gandhi', email: 'dharmgandhi@gmail.com', password: '1234' },
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

function* monthsBetweenInclusiveMinusOne(start, end) {
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  // Normalize and subtract one month
  const endNorm = new Date(end.getFullYear(), end.getMonth(), 1);
  endNorm.setMonth(endNorm.getMonth() - 1);

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

    const token = jwt.sign({ adminId: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '60d' });
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
    const { accountType, search } = req.query;

    // Build filter object
    let matchStage = { adminId: req.adminId };

    if (accountType && accountType.trim()) {
      matchStage.accountType = accountType.trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { firstName: searchRegex },
        { secondName: searchRegex },
        { mobileNumber: searchRegex }
      ];
    }

    // Aggregation pipeline
    const users = await User.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },

      // Lookup installments and count paid ones
      {
        $lookup: {
          from: 'installments', // MongoDB collection name (lowercase plural)
          localField: '_id',
          foreignField: 'userId',
          as: 'installments'
        }
      },
      {
        $addFields: {
          paidCount: {
            $size: {
              $filter: {
                input: '$installments',
                as: 'inst',
                cond: { $eq: ['$$inst.paid', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          installments: 0 // Hide full installments array from response
        }
      }
    ]);

    return res.json(users);
  } catch (e) {
    console.error(e);
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
    for (const { monthName, year } of monthsBetweenInclusiveMinusOne(start, end)) {
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
    
    // Find all installments for the specified month and year with user details
    const installments = await Installment.find({ 
      month, 
      year: y 
    }).populate('userId', 'firstName secondName mobileNumber monthlyAmount').lean();

    // Filter installments to only those belonging to the admin's users
    const users = await User.find({ adminId: req.adminId }).select('_id');
    const userIdSet = new Set(users.map(u => String(u._id)));
    const myRecords = installments.filter(r => r.userId && userIdSet.has(String(r.userId._id)));
    
    if (myRecords.length === 0) {
      return res.status(404).json({ error: 'No installments found for the specified month and year' });
    }

    // Sort by user first name
    myRecords.sort((a, b) => (a.userId.firstName || '').localeCompare(b.userId.firstName || ''));

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Installments ${month} ${year}`);

    // Define columns with the desired layout
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Second Name', key: 'secondName', width: 15 },
      { header: 'Monthly Amount', key: 'monthlyAmount', width: 15 },
      { header: 'Installment Amount', key: 'installmentAmount', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 18 },
      { header: 'Last Updated', key: 'lastUpdated', width: 20 },
      { header: 'Installment Month', key: 'month', width: 15 },
      { header: 'Installment Year', key: 'year', width: 15 },
    ];

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Calculate totals
    let totalMonthlyAmount = 0;
    let totalInstallmentAmount = 0;
    let totalPaidAmount = 0;

    // Add data rows and calculate totals
    myRecords.forEach((record, index) => {
      const user = record.userId || {};
      const monthlyAmount = user.monthlyAmount || 0;
      const installmentAmount = record.amount || 0;
      
      totalMonthlyAmount += monthlyAmount;
      totalInstallmentAmount += installmentAmount;
      if (record.paid) {
        totalPaidAmount += installmentAmount;
      }

      const row = worksheet.addRow({
        sno: index + 1,
        firstName: user.firstName || '',
        secondName: user.secondName || '',
        monthlyAmount: monthlyAmount,
        installmentAmount: installmentAmount,
        paymentStatus: record.paid ? 'Paid' : 'Pending',
        lastUpdated: record.updatedAt ? new Date(record.updatedAt).toLocaleString() : '',
        month: record.month,
        year: record.year,
      });

      // Style data rows
      row.eachCell((cell, cellNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Color coding for payment status
        if (cellNumber === 6) { // Payment Status column
          if (record.paid) {
            cell.font = { color: { argb: '00AA00' }, bold: true };
          } else {
            cell.font = { color: { argb: 'FF0000' }, bold: true };
          }
        }

        // Right align numeric columns
        if ([4, 5].includes(cellNumber)) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // Add totals row
    const totalsRow = worksheet.addRow({
      sno: '',
      firstName: 'TOTALS',
      secondName: '',
      monthlyAmount: totalMonthlyAmount,
      installmentAmount: totalInstallmentAmount,
      paymentStatus: `Paid: ${totalPaidAmount}`,
      lastUpdated: '',
      month: '',
      year: ''
    });

    // Style totals row
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true };
      if ([4, 5].includes(cell.col)) { // Monthly and Installment Amount columns
        cell.numFmt = '#,##0.00';
      }
    });

    // Add summary row
    const summaryRowIndex = myRecords.length + 3;
    worksheet.mergeCells(`A${summaryRowIndex}:E${summaryRowIndex}`);
    const summaryCell = worksheet.getCell(`A${summaryRowIndex}`);
    summaryCell.value = `Total Records: ${myRecords.length} | Generated on: ${new Date().toLocaleString()}`;
    summaryCell.font = { bold: true, italic: true };
    summaryCell.alignment = { horizontal: 'center' };

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Installments_${month}_${year}.xlsx"`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
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

    // Get and sort installments
    const monthOrder = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    const installments = await Installment.find({ userId: user._id }).lean();
    installments.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (monthOrder[a.month] || 13) - (monthOrder[b.month] || 13);
    });

    // Calculate totals
    const totalInstallments = installments.length;
    const paidInstallments = installments.filter(i => i.paid);
    const paidInstallmentsCount = paidInstallments.length;
    const totalPaidAmount = paidInstallments.reduce((sum, inst) => sum + inst.amount, 0);
    const leftInstallment = Math.max(0, (user.totalInvestmentAmount || 0) - totalPaidAmount);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Report');
    worksheet.properties.defaultRowHeight = 20;

    // 1. Company Header
    const companyRow = worksheet.addRow(['INVESTMENT REPORT']);
    worksheet.mergeCells('A1:H1');
    companyRow.getCell(1).font = { 
      bold: true, 
      size: 18, 
      color: { argb: 'FFFFFF' },
      name: 'Calibri'
    };
    companyRow.getCell(1).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    companyRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2E4A6B' } // Dark blue
    };
    companyRow.height = 35;

    // 2. User Details Header
    worksheet.addRow([]);
    const userHeaderRow = worksheet.addRow(['USER DETAILS']);
    worksheet.mergeCells(`A${userHeaderRow.number}:H${userHeaderRow.number}`);
    userHeaderRow.getCell(1).font = { 
      bold: true, 
      size: 14, 
      color: { argb: 'FFFFFF' },
      name: 'Calibri'
    };
    userHeaderRow.getCell(1).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    userHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4A90A4' } // Medium blue
    };
    userHeaderRow.height = 28;

    // 3. User Details Rows (4 columns layout)
    const userDetails = [
      ['First Name', user.firstName, 'Second Name', user.secondName || 'N/A'],
      ['Mobile Number', user.mobileNumber, 'Account Type', user.accountType || 'N/A'],
      ['Account No.1', user.accountNumber1, 'CIF No.1', user.cifNumber1],
      ['Account No.2', user.accountNumber2 || 'N/A', 'CIF No.2', user.cifNumber2 || 'N/A'],
      ['Monthly Amount', user.monthlyAmount, 'Maturity Amount', user.maturityAmount],
      ['Total Investment', user.totalInvestmentAmount, 'Left Investment', leftInstallment],
      ['Account Open Date', user.accountOpenDate, 'Account Close Date', user.accountCloseDate],
      ['Nominee Name', user.nomineeName, '', '']
    ];

    userDetails.forEach(detail => {
      const row = worksheet.addRow(detail);
      
      // Style label columns (odd columns)
      for (let i = 1; i <= 4; i += 2) {
        if (detail[i-1]) {
          const cell = row.getCell(i);
          cell.font = { 
            bold: true, 
            color: { argb: '2E4A6B' },
            name: 'Calibri'
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F0F8FF' } // Light blue
          };
          cell.alignment = { 
            horizontal: 'left', 
            vertical: 'middle',
            indent: 1
          };
        }
      }
      
      // Style value columns (even columns)
      for (let i = 2; i <= 4; i += 2) {
        if (detail[i-1]) {
          const cell = row.getCell(i);
          cell.font = { 
            name: 'Calibri',
            color: { argb: '333333' }
          };
          cell.alignment = { 
            horizontal: 'left', 
            vertical: 'middle',
            indent: 1
          };
          
          // Format currency values
          if (typeof detail[i-1] === 'number') {
            cell.numFmt = '₹#,##0.00';
          }
        }
      }
      
      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        };
      });
    });

    // 4. Installments Header
    worksheet.addRow([]);
    worksheet.addRow([]);
    const installmentsHeaderRow = worksheet.addRow(['INSTALLMENT DETAILS']);
    worksheet.mergeCells(`A${installmentsHeaderRow.number}:H${installmentsHeaderRow.number}`);
    installmentsHeaderRow.getCell(1).font = { 
      bold: true, 
      size: 14, 
      color: { argb: 'FFFFFF' },
      name: 'Calibri'
    };
    installmentsHeaderRow.getCell(1).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    installmentsHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4A90A4' } // Medium blue
    };
    installmentsHeaderRow.height = 28;

    // 5. Installments Table Headers
    const headerRow = worksheet.addRow([
      'S.No', 'Month', 'Year', 'Amount (₹)', 'Status', 'Created On', 'Updated On', ''
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFF' },
        name: 'Calibri',
        size: 11
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2E4A6B' } // Dark blue
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    });
    headerRow.height = 25;

    // 6. Installment Data Rows
    installments.forEach((inst, i) => {
      const row = worksheet.addRow([
        i + 1,
        inst.month,
        inst.year,
        inst.amount,
        inst.paid ? 'Paid' : 'Pending',
        new Date(inst.createdAt).toLocaleDateString(),
        new Date(inst.updatedAt).toLocaleDateString(),
        ''
      ]);

      // Alternate row colors
      const isEvenRow = (i + 1) % 2 === 0;
      const rowColor = isEvenRow ? 'F8F9FA' : 'FFFFFF';

      row.eachCell((cell) => {
        cell.font = { 
          name: 'Calibri',
          color: { argb: '333333' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowColor }
        };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'DDDDDD' } },
          left: { style: 'thin', color: { argb: 'DDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
          right: { style: 'thin', color: { argb: 'DDDDDD' } }
        };
      });

      // Format amount column
      row.getCell(4).numFmt = '₹#,##0.00';
      
      // Style status column based on paid/pending
      const statusCell = row.getCell(5);
      if (inst.paid) {
        statusCell.font = { 
          bold: true, 
          color: { argb: 'FFFFFF' },
          name: 'Calibri'
        };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '28A745' } // Green for paid
        };
      } else {
        statusCell.font = { 
          bold: true, 
          color: { argb: 'FFFFFF' },
          name: 'Calibri'
        };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DC3545' } // Red for pending
        };
      }
    });

    // 7. Summary Section
    worksheet.addRow([]);
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['SUMMARY']);
    worksheet.mergeCells(`A${summaryRow.number}:H${summaryRow.number}`);
    summaryRow.getCell(1).font = { 
      bold: true, 
      size: 12, 
      color: { argb: 'FFFFFF' },
      name: 'Calibri'
    };
    summaryRow.getCell(1).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    summaryRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6C757D' } // Gray
    };
    summaryRow.height = 25;

    const summaryDetails = [
      ['Total Installments:', totalInstallments, 'Paid Installments:', paidInstallmentsCount],
      ['Pending Installments:', totalInstallments - paidInstallmentsCount, 'Total Paid Amount:', `₹${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Remaining Amount:', `₹${leftInstallment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, '', '']
    ];

    summaryDetails.forEach(detail => {
      const row = worksheet.addRow(detail);
      
      // Style label columns
      for (let i = 1; i <= 4; i += 2) {
        if (detail[i-1]) {
          const cell = row.getCell(i);
          cell.font = { 
            bold: true, 
            color: { argb: '2E4A6B' },
            name: 'Calibri'
          };
        }
      }
      
      // Style value columns
      for (let i = 2; i <= 4; i += 2) {
        if (detail[i-1]) {
          const cell = row.getCell(i);
          cell.font = { 
            bold: true,
            color: { argb: '333333' },
            name: 'Calibri'
          };
        }
      }
      
      row.eachCell((cell) => {
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CCCCCC' } },
          left: { style: 'thin', color: { argb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
          right: { style: 'thin', color: { argb: 'CCCCCC' } }
        };
      });
    });

    // 8. Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 30);
    });

    // 9. Set response headers
    const safeName = `${user.firstName || 'User'}_${user._id}`.replace(/\s+/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_FullReport.xlsx"`);

    // 10. Send the workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to generate user report' });
  }
});

// ----------------------------------------
// Start
// ----------------------------------------
app.get('/', (_req, res) => console.log('Installment Tracker API is running 🚀'));

const SERVER_URL = "https://auth-tracking.onrender.com";  

function pingServer() {
  fetch(SERVER_URL)
    .then(() => console.log("🌐 Pinged server:", new Date().toLocaleTimeString()))
    .catch(err => console.error("Ping failed:", err.message));
}

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);

  // Ping immediately
  pingServer();

  // Then repeat every 2 minutes
  setInterval(pingServer, 120000);
});


