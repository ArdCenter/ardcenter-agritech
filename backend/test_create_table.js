const { createClient } = require('@libsql/client');
const path = require('path');
require('dotenv').config();

const client = createClient({
  url: 'https://market-db-therefore1.aws-ap-south-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function test() {
    try {
        console.log("Attempting to create table directly in Turso...");
        const res = await client.execute(`
            CREATE TABLE IF NOT EXISTS delivery_persons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                name TEXT NOT NULL,
                phone TEXT,
                vehicle TEXT,
                gps_position TEXT,
                availability TEXT DEFAULT 'disponible',
                delivery_zone TEXT,
                status TEXT DEFAULT 'libre',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log("Success:", res);
    } catch (e) {
        console.error("Error creating table:", e);
    }
}

test();
