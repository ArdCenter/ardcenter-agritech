const db = require('./database');

setTimeout(() => {
    const email = 'client2@ardcenter.com';
    const password = 'password123';
    
    // Check if it already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (row) {
            console.log('Account already exists');
            process.exit(0);
        } else {
            db.run(
                "INSERT INTO users (name, email, password, role) VALUES ('Client Test 2', ?, ?, 'user')",
                [email, password],
                function(err) {
                    if (err) console.error(err);
                    else console.log('Client created successfully.');
                    process.exit(0);
                }
            );
        }
    });
}, 1000);
