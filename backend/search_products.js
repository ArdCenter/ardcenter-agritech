const { createClient } = require('@libsql/client');
const path = require('path');

const client = createClient({
  url: `file:${path.resolve(__dirname, 'market.sqlite')}`
});

async function findProducts() {
    const names = ['Syllit', 'Agricar', 'Alta', 'Ferkam', 'Soufrema', 'Malyphos'];
    try {
        const results = [];
        for (const name of names) {
            const result = await client.execute({
                sql: "SELECT id, name, name_ar, image FROM products WHERE name LIKE ? OR name_ar LIKE ?",
                args: [`%${name}%`, `%${name}%`]
            });
            results.push(...result.rows);
        }
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

findProducts();
