import { boolean, char, date, integer, pgTable, time, uuid, varchar } from "drizzle-orm/pg-core";

// Schema
export const user = pgTable("users", {
    id: integer().generatedAlwaysAsIdentity(),
    name: varchar({length: 255}).notNull(),
    email: varchar({length: 255}).notNull().primaryKey(),
    password: varchar({length: 256}),
    salt1: varchar({length: 512}),
    salt2: varchar({length: 512}),
    role: varchar({enum: ["owner", "admin", "user"]})
})

// Session :)
export const session = pgTable("session", {
    id: integer().generatedAlwaysAsIdentity(),
    token: varchar().notNull(),
    userID: integer(),
    expirationTime: varchar().notNull(),
    expired: boolean().notNull().default(false),
})