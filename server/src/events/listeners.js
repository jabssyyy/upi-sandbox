import { appEvents } from './appEvents.js';
import { formatPaise } from '../utils/money.js';

// Tiny audit trail on the console. Called once at startup from server.js.
export function registerListeners() {
  appEvents.on('transfer.completed', ({ sender, receiver, amount }) => {
    console.log(`[audit] transfer.completed ${formatPaise(amount)} ${sender.upiId} -> ${receiver.upiId}`);
  });

  appEvents.on('transfer.blocked', ({ sender, receiver, amount, ruleHit }) => {
    console.log(`[audit] transfer.blocked ${formatPaise(amount)} ${sender.upiId} -> ${receiver.upiId} by ${ruleHit.key}: ${ruleHit.reason}`);
  });

  appEvents.on('rule.updated', ({ rule, admin }) => {
    console.log(`[audit] rule.updated ${rule.key} by ${admin.email}: enabled=${rule.enabled} params=${JSON.stringify(rule.params)}`);
  });
}
