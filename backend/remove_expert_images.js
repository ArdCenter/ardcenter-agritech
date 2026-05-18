const db = require('./database');

setTimeout(() => {
    db.run("UPDATE experts SET profile_image = NULL", [], function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log("All expert images have been removed from the database.");
        }
        process.exit(0);
    });
}, 1000);
