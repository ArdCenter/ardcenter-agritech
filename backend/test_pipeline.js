const path = require('path');
require('dotenv').config();

const finalDbUrl = 'https://market-db-therefore1.aws-ap-south-1.turso.io';
const authToken = process.env.DATABASE_AUTH_TOKEN;

async function test() {
    try {
        console.log("Attempting to create table via Turso Pipeline API...");
        
        const sql = `
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
        `;
        
        const response = await fetch(`${finalDbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: [] } }] })
        });
        
        const data = await response.json();
        console.log("Status Code:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
