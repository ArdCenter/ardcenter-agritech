const { createClient } = require('@libsql/client');
const path = require('path');

const client = createClient({
  url: `file:${path.resolve(__dirname, 'market.sqlite')}`
});

async function listProducts() {
    try {
        const result = await client.execute('SELECT id, name, name_ar, image FROM products');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

listProducts();
