import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { appEvents } from '../events/appEvents.js';
import { AppError } from '../utils/AppError.js';

// Moves money from sender to receiver. All three writes succeed together or not at all.
export async function execute({ sender, receiver, amount, note }) {
  const session = await mongoose.startSession();
  try {
    let result;

    await session.withTransaction(async () => {
      // 1. Debit, but only if the balance is still enough at this exact moment.
      //    The condition and the change happen in one atomic step, so two parallel
      //    transfers can never both spend the same money.
      const updatedSender = await User.findOneAndUpdate(
        { _id: sender._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session, returnDocument: 'after' },
      );
      if (!updatedSender) throw new AppError('INSUFFICIENT_BALANCE', 400, 'Not enough balance');

      // 2. Credit. If the receiver vanished, throwing here undoes the debit above.
      const credit = await User.updateOne({ _id: receiver._id }, { $inc: { balance: amount } }, { session });
      if (credit.matchedCount === 0) throw new AppError('NOT_FOUND', 404, 'Receiver no longer exists');

      // 3. Ledger row. create() needs an array when passing a session.
      const [transaction] = await Transaction.create(
        [{ from: sender._id, to: receiver._id, amount, status: 'success', note }],
        { session },
      );

      result = { transaction, balance: updatedSender.balance };
    });

    // Only announce it once the transaction has really committed.
    appEvents.emit('transfer.completed', { sender, receiver, amount, transaction: result.transaction });
    return result;
  } finally {
    await session.endSession();
  }
}
