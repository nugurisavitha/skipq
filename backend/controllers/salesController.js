const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const mongoose = require('mongoose');
const User = require('../models/User');
const SalesRep = require('../models/SalesRep');
const SalesStatement = require('../models/SalesStatement');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// ---------- Helpers ----------

const monthRange = (periodMonth) => {
  // periodMonth: 'YYYY-MM'
  const [y, m] = periodMonth.split('-').map(Number);
  if (!y || !m) throw new Error('Invalid periodMonth (expected YYYY-MM)');
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
};

const currentMonthStr = () => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// ---------- Sales Rep CRUD ----------

// POST /api/sales/reps
// body accepts EITHER:
//   { userId, ... }               -> attach SalesRep profile to existing user
// OR:
//   { name, email, phone, password?, ... } -> create user inline + SalesRep profile
// Plus common plan fields: employeeCode, managerId, territory, cities, foodCourts,
// baseSalary, gmvPercent, activationBonus, monthlyTargetGmv, notes
exports.createRep = asyncHandler(async (req, res) => {
  const {
    userId,
    name,
    email,
    phone,
    password,
    employeeCode,
    managerId,
    territory,
    cities,
    foodCourts,
    baseSalary,
    gmvPercent,
    activationBonus,
    monthlyTargetGmv,
    notes,
  } = req.body;

  let user;
  if (userId) {
    user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  } else {
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists. Use the existing user.',
        data: { existingUserId: existing._id },
      });
    }
    const pwd = password && password.length >= 6 ? password : Math.random().toString(36).slice(-10) + 'A1!';
    user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || undefined,
      password: pwd,
      role: 'sales_rep',
      isVerified: true,
    });
  }

  // Upgrade role if user exists but is still a plain customer
  if (!['sales_rep', 'sales_manager'].includes(user.role)) {
    user.role = 'sales_rep';
    await user.save();
  }

  // Prevent duplicate SalesRep profile for the same user
  const dup = await SalesRep.findOne({ user: user._id });
  if (dup) {
    return res.status(400).json({
      success: false,
      message: 'This user already has a sales rep profile',
      data: { repId: dup._id },
    });
  }

  const rep = await SalesRep.create({
    user: user._id,
    employeeCode,
    manager: managerId || undefined,
    territory,
    cities,
    foodCourts,
    baseSalary: Number(baseSalary) || 0,
    commissionPlan: {
      gmvPercent: Number(gmvPercent) || 0,
      activationBonus: Number(activationBonus) || 0,
      monthlyTargetGmv: Number(monthlyTargetGmv) || 0,
    },
    notes,
  });

  const populated = await SalesRep.findById(rep._id).populate('user', 'name email phone role');
  res.status(201).json({ success: true, data: { rep: populated } });
});

exports.listReps = asyncHandler(async (req, res) => {
  const { active, territory, managerId, q } = req.query;
  const filter = {};
  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;
  if (territory) filter.territory = territory;
  if (managerId) filter.manager = managerId;

  let reps = await SalesRep.find(filter)
    .populate('user', 'name email phone role')
    .populate('manager', 'name email')
    .sort({ createdAt: -1 });

  if (q) {
    const needle = String(q).toLowerCase();
    reps = reps.filter((r) => {
      const u = r.user || {};
      return [u.name, u.email, u.phone, r.employeeCode, r.territory]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }

  res.status(200).json({ success: true, data: { reps } });
});

// GET /api/sales/reps/:id
exports.getRep = asyncHandler(async (req, res) => {
  const rep = await SalesRep.findById(req.params.id)
    .populate('user', 'name email phone role')
    .populate('manager', 'name email');
  if (!rep) return res.status(404).json({ success: false, message: 'Rep not found' });

  const restaurants = await Restaurant.find({ salesRep: rep.user._id })
    .select('name slug isActive activatedAt createdAt');

  res.status(200).json({ success: true, data: { rep, restaurants } });
});

// PATCH /api/sales/reps/:id
exports.updateRep = asyncHandler(async (req, res) => {
  const rep = await SalesRep.findById(req.params.id);
  if (!rep) return res.status(404).json({ success: false, message: 'Rep not found' });

  const {
    employeeCode,
    managerId,
    territory,
    cities,
    foodCourts,
    baseSalary,
    gmvPercent,
    activationBonus,
    monthlyTargetGmv,
    isActive,
    notes,
  } = req.body;

  if (employeeCode !== undefined) rep.employeeCode = employeeCode;
  if (managerId !== undefined) rep.manager = managerId || undefined;
  if (territory !== undefined) rep.territory = territory;
  if (cities !== undefined) rep.cities = cities;
  if (foodCourts !== undefined) rep.foodCourts = foodCourts;
  if (baseSalary !== undefined) rep.baseSalary = Number(baseSalary) || 0;
  if (gmvPercent !== undefined) rep.commissionPlan.gmvPercent = Number(gmvPercent) || 0;
  if (activationBonus !== undefined) rep.commissionPlan.activationBonus = Number(activationBonus) || 0;
  if (monthlyTargetGmv !== undefined) rep.commissionPlan.monthlyTargetGmv = Number(monthlyTargetGmv) || 0;
  if (isActive !== undefined) rep.isActive = !!isActive;
  if (notes !== undefined) rep.notes = notes;

  await rep.save();
  const populated = await SalesRep.findById(rep._id).populate('user', 'name email phone role');
  res.status(200).json({ success: true, data: { rep: populated } });
});

// DELETE /api/sales/reps/:id  (soft: set inactive)
exports.deactivateRep = asyncHandler(async (req, res) => {
  const rep = await SalesRep.findById(req.params.id);
  if (!rep) return res.status(404).json({ success: false, message: 'Rep not found' });
  rep.isActive = false;
  await rep.save();
  res.status(200).json({ success: true, data: { rep } });
});

// ---------- Restaurant attribution ----------

// POST /api/sales/attribution
// body: { restaurantId, userId }  (userId is the sales rep user id; may be null to clear)
exports.assignRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, userId } = req.body;
  if (!restaurantId) return res.status(400).json({ success: false, message: 'restaurantId required' });

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

  if (userId) {
    const rep = await SalesRep.findOne({ user: userId });
    if (!rep) return res.status(404).json({ success: false, message: 'SalesRep profile not found for user' });
  }

  restaurant.salesRep = userId || undefined;
  await restaurant.save();
  res.status(200).json({ success: true, data: { restaurant } });
});

// GET /api/sales/reps/:id/restaurants
exports.listRestaurantsForRep = asyncHandler(async (req, res) => {
  const rep = await SalesRep.findById(req.params.id);
  if (!rep) return res.status(404).json({ success: false, message: 'Rep not found' });
  const restaurants = await Restaurant.find({ salesRep: rep.user }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { restaurants } });
});

// ---------- Statement generation / workflow ----------

async function computeStatementForRep(rep, periodMonth) {
  const { start, end } = monthRange(periodMonth);

  const restaurants = await Restaurant.find({ salesRep: rep.user }).select('_id activatedAt createdAt');
  const restaurantIds = restaurants.map((r) => r._id);

  let gmv = 0;
  if (restaurantIds.length) {
    const agg = await Order.aggregate([
      {
        $match: {
          restaurant: { $in: restaurantIds },
          status: { $in: ['delivered', 'completed'] },
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    gmv = (agg[0] && agg[0].total) || 0;
  }

  // Activations: restaurants whose activatedAt falls in period (fall back to createdAt if no activatedAt)
  const activations = restaurants.filter((r) => {
    const t = r.activatedAt || r.createdAt;
    return t && t >= start && t < end;
  }).length;

  const gmvPercent = rep.commissionPlan.gmvPercent || 0;
  const activationBonusPerUnit = rep.commissionPlan.activationBonus || 0;
  const commissionAmount = Math.round(gmv * gmvPercent) / 100;
  const activationBonusTotal = activations * activationBonusPerUnit;
  const baseSalary = rep.baseSalary || 0;

  return {
    baseSalary,
    gmv,
    attributedRestaurants: restaurantIds.length,
    gmvPercent,
    commissionAmount,
    activations,
    activationBonusPerUnit,
    activationBonusTotal,
  };
}

// POST /api/sales/statements/generate  body: { periodMonth?: 'YYYY-MM', repIds?: [] }
exports.generateStatements = asyncHandler(async (req, res) => {
  const periodMonth = req.body.periodMonth || currentMonthStr();
  const repFilter = { isActive: true };
  if (Array.isArray(req.body.repIds) && req.body.repIds.length) {
    repFilter._id = { $in: req.body.repIds };
  }
  const reps = await SalesRep.find(repFilter);
  const results = [];

  for (const rep of reps) {
    const existing = await SalesStatement.findOne({ salesRep: rep._id, periodMonth });
    if (existing && ['finance_locked', 'paid'].includes(existing.status)) {
      results.push({ rep: rep._id, skipped: true, reason: 'locked' });
      continue;
    }
    const computed = await computeStatementForRep(rep, periodMonth);
    const adjustmentsTotal = existing
      ? (existing.adjustments || []).reduce((s, a) => s + (a.amount || 0), 0)
      : 0;
    const totalPayout =
      computed.baseSalary + computed.commissionAmount + computed.activationBonusTotal + adjustmentsTotal;

    const doc = existing || new SalesStatement({ salesRep: rep._id, user: rep.user, periodMonth });
    Object.assign(doc, computed, { adjustmentsTotal, totalPayout });
    if (!existing) doc.status = 'draft';
    // If was manager_approved and we regenerate, revert to draft so changes are re-approved
    if (existing && existing.status === 'manager_approved') doc.status = 'draft';
    await doc.save();
    results.push({ rep: rep._id, statementId: doc._id, status: doc.status });
  }

  res.status(200).json({ success: true, data: { periodMonth, results } });
});

// GET /api/sales/statements?periodMonth=&status=&repId=
exports.listStatements = asyncHandler(async (req, res) => {
  const { periodMonth, status, repId } = req.query;
  const filter = {};
  if (periodMonth) filter.periodMonth = periodMonth;
  if (status && status !== 'all') filter.status = status;
  if (repId) filter.salesRep = repId;

  const statements = await SalesStatement.find(filter)
    .populate({ path: 'salesRep', populate: { path: 'user', select: 'name email phone' } })
    .sort({ periodMonth: -1, createdAt: -1 });
  res.status(200).json({ success: true, data: { statements } });
});

// GET /api/sales/statements/:id
exports.getStatement = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id)
    .populate({ path: 'salesRep', populate: { path: 'user', select: 'name email phone role' } })
    .populate('managerApprovedBy', 'name email')
    .populate('financeLockedBy', 'name email')
    .populate('adjustments.by', 'name email');
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  res.status(200).json({ success: true, data: { statement: s } });
});

// POST /api/sales/statements/:id/adjustments  body: { type, amount, note }
exports.addAdjustment = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  if (['finance_locked', 'paid'].includes(s.status)) {
    return res.status(400).json({ success: false, message: 'Statement is locked' });
  }
  const { type = 'other', amount, note } = req.body;
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'amount (number) is required' });
  }
  s.adjustments.push({ type, amount, note, by: req.user && req.user._id });
  s.adjustmentsTotal = s.adjustments.reduce((sum, a) => sum + (a.amount || 0), 0);
  s.totalPayout = s.baseSalary + s.commissionAmount + s.activationBonusTotal + s.adjustmentsTotal;
  if (s.status === 'manager_approved') s.status = 'draft';
  await s.save();
  res.status(200).json({ success: true, data: { statement: s } });
});

// POST /api/sales/statements/:id/manager-approve
exports.managerApprove = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  if (s.status !== 'draft') {
    return res.status(400).json({ success: false, message: `Cannot approve from status ${s.status}` });
  }
  s.status = 'manager_approved';
  s.managerApprovedBy = req.user && req.user._id;
  s.managerApprovedAt = new Date();
  await s.save();
  res.status(200).json({ success: true, data: { statement: s } });
});

// POST /api/sales/statements/:id/finance-lock
exports.financeLock = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  if (s.status !== 'manager_approved') {
    return res.status(400).json({ success: false, message: 'Statement must be manager-approved first' });
  }
  s.status = 'finance_locked';
  s.financeLockedBy = req.user && req.user._id;
  s.financeLockedAt = new Date();
  await s.save();
  res.status(200).json({ success: true, data: { statement: s } });
});

// POST /api/sales/statements/:id/mark-paid
exports.markPaid = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  if (s.status !== 'finance_locked') {
    return res.status(400).json({ success: false, message: 'Statement must be finance-locked before paying' });
  }
  s.status = 'paid';
  s.paidAt = new Date();
  await s.save();
  res.status(200).json({ success: true, data: { statement: s } });
});

// POST /api/sales/statements/:id/reopen  (Finance/Admin can unlock draft if mistake)
exports.reopenStatement = asyncHandler(async (req, res) => {
  const s = await SalesStatement.findById(req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Statement not found' });
  if (s.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Paid statements cannot be reopened' });
  }
  s.status = 'draft';
  s.managerApprovedBy = undefined;
  s.managerApprovedAt = undefined;
  s.financeLockedBy = undefined;
  s.financeLockedAt = undefined;
  await s.save();
  res.status(200).json({ success: true, data: { statement: s } });
});

// GET /api/sales/statements/export.csv?periodMonth=YYYY-MM&status=
exports.exportCsv = asyncHandler(async (req, res) => {
  const { periodMonth, status } = req.query;
  const filter = {};
  if (periodMonth) filter.periodMonth = periodMonth;
  if (status && status !== 'all') filter.status = status;
  const statements = await SalesStatement.find(filter)
    .populate({ path: 'salesRep', populate: { path: 'user', select: 'name email phone' } })
    .sort({ periodMonth: -1 });

  const headers = [
    'Period',
    'Employee Code',
    'Name',
    'Email',
    'Phone',
    'Base Salary',
    'GMV',
    'GMV %',
    'Commission',
    'Activations',
    'Activation Bonus',
    'Adjustments',
    'Total Payout',
    'Status',
    'Approved By',
    'Approved At',
    'Locked By',
    'Locked At',
  ];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = statements.map((s) => {
    const u = (s.salesRep && s.salesRep.user) || {};
    return [
      s.periodMonth,
      (s.salesRep && s.salesRep.employeeCode) || '',
      u.name || '',
      u.email || '',
      u.phone || '',
      s.baseSalary,
      s.gmv,
      s.gmvPercent,
      s.commissionAmount,
      s.activations,
      s.activationBonusTotal,
      s.adjustmentsTotal,
      s.totalPayout,
      s.status,
      s.managerApprovedBy || '',
      s.managerApprovedAt ? s.managerApprovedAt.toISOString() : '',
      s.financeLockedBy || '',
      s.financeLockedAt ? s.financeLockedAt.toISOString() : '',
    ].map(escape).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="sales-statements-${periodMonth || 'all'}.csv"`
  );
  res.status(200).send(csv);
});

// ---------- Rep self-service ----------

// GET /api/sales/me
exports.getMyProfile = asyncHandler(async (req, res) => {
  const rep = await SalesRep.findOne({ user: req.user._id })
    .populate('user', 'name email phone role')
    .populate('manager', 'name email');
  if (!rep) return res.status(404).json({ success: false, message: 'No sales rep profile' });

  const periodMonth = req.query.periodMonth || currentMonthStr();
  const computed = await computeStatementForRep(rep, periodMonth);
  const targetGmv = rep.commissionPlan.monthlyTargetGmv || 0;
  const attainmentPct = targetGmv > 0 ? Math.round((computed.gmv / targetGmv) * 1000) / 10 : 0;

  const statements = await SalesStatement.find({ salesRep: rep._id })
    .sort({ periodMonth: -1 })
    .limit(12);

  res.status(200).json({
    success: true,
    data: { rep, periodMonth, currentPeriod: { ...computed, targetGmv, attainmentPct }, statements },
  });
});
