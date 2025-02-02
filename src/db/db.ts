import {drizzle} from 'drizzle-orm/node-postgres';
// Setup utilizing node-postgres adapter and create db connector
export const db = async () => {
    return await await drizzle(process.env.DATABASE_URL!)
}