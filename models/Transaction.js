import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  txHash: { type: String, index: true },
  type: { type: String, enum: ['send', 'receive', 'swap', 'other'], default: 'other' },
  token: { type: String },
  amount: { type: String },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)
