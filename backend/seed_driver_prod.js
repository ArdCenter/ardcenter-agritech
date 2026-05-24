require('dotenv').config();

const finalDbUrl = 'https://market-db-therefore1.aws-ap-south-1.turso.io';
const authToken = process.env.DATABASE_AUTH_TOKEN;

async function runQuery(sql, args = []) {
    const pipelineArgs = args.map(arg => {
        if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
        if (arg === null) return { type: 'null' };
        return { type: 'text', value: String(arg) };
    });

    const response = await fetch(`${finalDbUrl}/v2/pipeline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: pipelineArgs } }] })
    });
    
    const data = await response.json();
    if (!response.ok || (data.results && data.results[0] && data.results[0].type === 'error')) {
        const errorMsg = data.results && data.results[0] && data.results[0].error ? data.results[0].error.message : 'Query failed';
        throw new Error(errorMsg);
    }
    
    const result = data.results[0].response.result;
    const rows = (result.rows || []).map(row => {
        const obj = {};
        if (result.cols) {
            result.cols.forEach((col, i) => {
                obj[col.name] = row[i] ? row[i].value : null;
            });
        }
        return obj;
    });
    return { rows, last_insert_rowid: result.last_insert_rowid };
}

async function seed() {
    try {
        console.log("Seeding driver user in production...");
        
        // 1. Check if user already exists
        const userCheck = await runQuery("SELECT id FROM users WHERE email = 'livreur@ardcenter.com'");
        let userId;
        
        if (userCheck.rows.length === 0) {
            console.log("Inserting user...");
            const insertUser = await runQuery(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ['Rachid El Alami', 'livreur@ardcenter.com', 'livreur', 'driver']
            );
            userId = insertUser.last_insert_rowid;
        } else {
            console.log("User already exists.");
            userId = userCheck.rows[0].id;
        }
        
        console.log("User ID:", userId);
        
        // 2. Check if Rachid exists in delivery_persons
        const driverCheck = await runQuery("SELECT id FROM delivery_persons WHERE name = 'Rachid El Alami'");
        
        if (driverCheck.rows.length === 0) {
            console.log("Inserting delivery person...");
            await runQuery(
                "INSERT INTO delivery_persons (user_id, name, phone, vehicle, gps_position, availability, delivery_zone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [userId, "Rachid El Alami", "+212 612-345678", "Moto (Yamaha TMAX)", "32.2994, -9.2372", "disponible", "Safi Center", "libre"]
            );
        } else {
            console.log("Delivery person exists. Updating user_id and zone...");
            await runQuery(
                "UPDATE delivery_persons SET user_id = ?, delivery_zone = 'Safi Center', gps_position = '32.2994, -9.2372' WHERE name = 'Rachid El Alami'",
                [userId]
            );
        }
        
        console.log("Success! Delivery driver account has been seeded in production.");
        console.log("Email: livreur@ardcenter.com");
        console.log("Password: livreur");
    } catch (e) {
        console.error("Error:", e);
    }
}

seed();
