const mongoose = require('mongoose');

const salesRepSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeCode: { type: String, unique: true, sparse: true, trim: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    territory: { type: String, trim: true },
    cities: [{ type: String, trim: true }],
    foodCourts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodCourt' }],
    baseSalary: { type: Number, default: 0, min: 0 },
    commissionPlan: {
      gmvPercent: { type: Number, default: 0, min: 0, max: 100 },
      activationBonus: { type: Number, default: 0, min: 0 },
      monthlyTargetGmv: { type: Number, default: 0, min: 0 },
    },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesRep', salesRepSchema);
