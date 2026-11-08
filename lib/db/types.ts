import type { db } from "@/lib/db";
export type Database = typeof db;
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbExecutor = Database | DbTransaction;
