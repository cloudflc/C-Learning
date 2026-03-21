const mongoose = require('mongoose');

const rankConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minExp: { type: Number, required: true },
  icon: { type: String, default: '🥉' },
  color: { type: String, default: '#CD7F32' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String }
}, { timestamps: true });

module.exports = {
  RankConfig: mongoose.model('RankConfig', rankConfigSchema),
  SystemConfig: mongoose.model('SystemConfig', systemConfigSchema)
};
