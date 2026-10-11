import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false means queries leave this field out unless we ask with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    upiId: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9.]+@sandbox$/ },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    balance: {
      type: Number,
      default: 10000000, // ₹1,00,000 in paise
      min: 0,
      validate: { validator: Number.isInteger, message: 'balance must be whole paise' },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
