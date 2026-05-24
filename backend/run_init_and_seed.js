const db = require('./database');

setTimeout(async () => {
    try {
        console.log("Database initialized. Seeding delivery user account...");
        
        // Insert driver into users table
        await db.execute({
            sql: "INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            args: ['Rachid El Alami', 'livreur@ardcenter.com', 'livreur', 'driver']
        });
        
        // Get the inserted user's ID
        const user = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: ['livreur@ardcenter.com']
        });
        const userId = user.rows[0].id;
        
        // Update the delivery person Rachid El Alami to link with this user_id
        await db.execute({
            sql: "UPDATE delivery_persons SET user_id = ? WHERE name = ?",
            args: [userId, 'Rachid El Alami']
        });
        
        console.log("Driver user seeded successfully!");
        console.log("Email: livreur@ardcenter.com");
        console.log("Password: livreur");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding driver:", e);
        process.exit(1);
    }
}, 3000);
