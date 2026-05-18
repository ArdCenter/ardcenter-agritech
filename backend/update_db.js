const db = require('./database');
db.run("UPDATE expert_categories SET image = '/experts/cat_smart_agri.png' WHERE id = 7", [], function(err) {
    if (err) console.error(err);
    else console.log("Updated successfully");
    process.exit(0);
});
