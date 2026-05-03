const { createClient } = require('@libsql/client');
const path = require('path');

const client = createClient({
  url: `file:${path.resolve(__dirname, 'market.sqlite')}`
});

async function findPhyto() {
    try {
        const result = await client.execute("SELECT id, name, name_ar, image, category FROM products WHERE category = 'Phytosanitaires'");
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

findPhyto();
