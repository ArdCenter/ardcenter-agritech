const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const REMOTE_API_URL = "https://marketplace-cs1z.onrender.com";

const dbPath = path.resolve(__dirname, 'market.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de l\'ouverture de la base locale:', err.message);
        process.exit(1);
    }
    console.log('Connecté à la base de données locale.');
});

async function migrate() {
    db.all('SELECT * FROM products', [], async (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des produits locaux:', err);
            return;
        }

        console.log(`📦 ${rows.length} produits trouvés en local. Début de la migration...`);

        for (const product of rows) {
            console.log(`Envoi de : ${product.name || product.name_ar}...`);
            try {
                const payload = {
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    image: product.image,
                    images_gallery: product.images_gallery ? JSON.parse(product.images_gallery) : [],
                    is_rental: product.is_rental === 1,
                    description: product.description,
                    short_description: product.short_description,
                    short_description_ar: product.short_description_ar,
                    advantages: product.advantages,
                    advantages_ar: product.advantages_ar,
                    usage_tips: product.usage_tips,
                    usage_tips_ar: product.usage_tips_ar,
                    name_ar: product.name_ar,
                    description_ar: product.description_ar,
                    technical_specs: product.technical_specs ? JSON.parse(product.technical_specs) : [],
                    technical_specs_ar: product.technical_specs_ar ? JSON.parse(product.technical_specs_ar) : []
                };

                const res = await fetch(`${REMOTE_API_URL}/api/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    console.log(`✅ ${product.name || product.name_ar} migré avec succès.`);
                } else {
                    const errText = await res.text();
                    console.error(`❌ Échec pour ${product.name}: ${res.status} - ${errText}`);
                }
            } catch (fetchErr) {
                console.error(`❌ Erreur réseau pour ${product.name}:`, fetchErr.message);
            }
        }

        console.log('Migration terminée.');
        db.close();
    });
}

migrate();
