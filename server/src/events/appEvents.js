import { EventEmitter } from 'node:events';

// One shared emitter for the whole app. Code that "emits" doesn't need to know who listens.
// Events: 'transfer.completed', 'transfer.blocked', 'rule.updated'
export const appEvents = new EventEmitter();
