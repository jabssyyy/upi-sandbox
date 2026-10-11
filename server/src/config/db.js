import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  // A mongodb+srv:// address needs a DNS "SRV" lookup to find the cluster's servers.
  // Some Windows setups hand Node a local DNS proxy (127.0.0.1) that refuses it,
  // giving "querySrv ECONNREFUSED". DNS_SERVERS in .env lets us ask public DNS instead.
  if (env.dnsServers.length > 0) dns.setServers(env.dnsServers);

  // Waits until Atlas accepts the connection, or throws if it can't.
  await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}
