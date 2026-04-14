const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['bonus', 'deduction', 'reimbursement', 'advance_recovery', 'other'], default: 'other' },
    amount: { type: Number, required: true },
    note: { type: String, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const salesStatementSchema = new mongoose.Schema(
  {
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRep', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodMonth: { type: String, required: true, index: true }, // 'YYYY-MM'
    baseSalary: { type: Number, default: 0 },
    gmv: { type: Number, default: 0 },
    attributedRestaurants: { type: Number, default: 0 },
    gmvPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    activations: { type: Number, default: 0 },
    activationBonusPerUnit: { type: Number, default: 0 },
    activationBonusTotal: { type: Number, default: 0 },
    adjustments: [adjustmentSchema],
    adjustmentsTotal: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'manager_approved', 'finance_locked', 'paid'],
      default: 'draft',
      index: true,
    },
    managerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerApprovedAt: { type: Date },
    financeLockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    financeLockedAt: { type: Date },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

salesStatementSchema.index({ salesRep: 1, periodMonth: 1 }, { unique: true });

module.exports = mongoose.model('SalesStatement', salesStatementSchema);
