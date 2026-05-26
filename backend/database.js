require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');

const rawDbUrl = (process.env.DATABASE_URL || '').trim();
const isProd = !!rawDbUrl;
const dbUrl = isProd ? rawDbUrl : `file:${path.resolve(__dirname, 'market.sqlite')}`;
const authToken = (process.env.DATABASE_AUTH_TOKEN || '').trim();

// Fix: Turso sometimes has issues with the libsql:// protocol in certain library versions.
// We convert it to https:// for the REST client to be more stable.
let finalDbUrl = dbUrl;
if (isProd && dbUrl.startsWith('libsql://')) {
  finalDbUrl = dbUrl.replace('libsql://', 'https://');
}
if (isProd && !finalDbUrl.startsWith('http')) {
  finalDbUrl = 'https://' + finalDbUrl;
}

console.log('--- Database Connection Info ---');
console.log(`Mode: ${isProd ? 'Production (Turso Cloud)' : 'Development (Local SQLite)'}`);
console.log(`Original URL: ${dbUrl}`);
console.log(`Final URL: ${finalDbUrl}`);
if (isProd) {
  if (authToken) {
    const masked = authToken.substring(0, 5) + '...' + authToken.substring(authToken.length - 5);
    console.log(`Auth Token: Present (${masked})`);
  } else {
    console.log('Auth Token: MISSING TOKEN');
  }
}
console.log('-------------------------------');

let client;
try {
  client = createClient({
    url: finalDbUrl,
    authToken: authToken,
  });
} catch (error) {
  console.error('Failed to create LibSQL client:', error);
}

// A wrapper to maintain compatibility with the existing sqlite3 callback-based API
const db = {
  execute: async function(sql, params) {
    let args = params || [];
    if (typeof sql === 'object') {
      args = sql.args || [];
      sql = sql.sql;
    }
    
    // Map arguments to safe types for LibSQL (prevents "unsupported type" panics)
    const mappedArgs = args.map(arg => {
      if (typeof arg === 'number') {
        return Number.isInteger(arg) ? BigInt(arg) : arg;
      }
      if (typeof arg === 'boolean') return arg ? 1 : 0;
      if (arg === null || arg === undefined) return null;
      return String(arg);
    });

    // In production, use the direct Web API which we proved works
    if (isProd) {
      // Turso's pipeline API expects arguments to be "Value" objects (type + value)
      const pipelineArgs = mappedArgs.map(arg => {
        if (typeof arg === 'bigint' || (typeof arg === 'number' && Number.isInteger(arg))) {
          return { type: 'integer', value: String(arg) };
        }
        if (typeof arg === 'number') return { type: 'float', value: arg };
        if (arg === null) return { type: 'null' };
        return { type: 'text', value: String(arg) };
      });

      const response = await fetch(`${finalDbUrl}/v2/pipeline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: pipelineArgs } }] })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Turso pipeline error:', data);
        throw new Error(data.error || 'Database request failed');
      }
      
      const firstResult = data.results && data.results[0];
      if (!firstResult) {
        throw new Error('Empty Turso pipeline response');
      }
      if (firstResult.type === 'error') {
        console.error('Turso statement error:', firstResult.error);
        throw new Error(firstResult.error.message || 'Turso statement execution failed');
      }
      
      const result = firstResult.response.result;
      if (!result) {
        throw new Error('Missing result in Turso pipeline response');
      }
      
      const rows = (result.rows || []).map(row => {
        const obj = {};
        if (result.cols) {
          result.cols.forEach((col, i) => {
            let val = row[i] ? row[i].value : null;
            if (row[i] && (row[i].type === 'integer' || row[i].type === 'float')) {
              val = Number(val);
            }
            obj[col.name] = val;
          });
        }
        return obj;
      });

      return { 
        rows,
        affected_row_count: result.affected_row_count,
        last_insert_rowid: result.last_insert_rowid
      };
    }

    // In local development, use the library or direct sqlite3 (via client)
    return client.execute({ sql, args: mappedArgs });
  },

  all: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    this.execute(sql, params)
      .then(result => {
        if (callback) callback(null, result.rows);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    this.execute(sql, params)
      .then(result => {
        if (callback) callback.call({ lastID: result.last_insert_rowid || result.lastInsertRowid }, null);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  get: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    this.execute(sql, params)
      .then(result => {
        if (callback) callback(null, result.rows[0]);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  prepare: function(sql) {
    return {
      run: function(...args) {
        const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
        db.execute({ sql, args })
          .then(result => {
            if (callback) callback.call({ lastID: result.lastInsertRowid }, null);
          })
          .catch(err => {
            if (callback) callback(err);
          });
      },
      finalize: function() {}
    };
  }
};

// Initialize tables
const initDb = async function initDb() {
  console.log('Initializing Database...');
  try {
    // Manual Handshake Check (using standard fetch)
    if (isProd) {
        console.log('Performing manual handshake with Turso...');
        const response = await fetch(`${finalDbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }] })
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error(`Manual handshake failed! Status: ${response.status}, Details: ${errText}`);
        } else {
            console.log('Manual handshake successful!');
        }
    }

    // Basic connectivity check using our new executor
    await db.execute('SELECT 1');
    console.log('Database connection successful.');

    await db.execute(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            price TEXT,
            numericPrice INTEGER,
            image TEXT,
            availability TEXT,
            availabilityBg TEXT,
            availabilityText TEXT,
            is_rental INTEGER DEFAULT 0
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            phone TEXT,
            role TEXT DEFAULT 'user'
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            location TEXT,
            zones TEXT,
            surface TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_num TEXT,
            date TEXT,
            amount TEXT,
            status TEXT,
            payment_status TEXT DEFAULT 'Unpaid',
            delivery_status TEXT DEFAULT 'Préparation',
            payment_method TEXT,
            estimated_delivery TEXT,
            farm_name TEXT,
            parcel_num TEXT,
            street TEXT,
            city TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Migration check for orders table
        try {
            const columns = [
                { name: 'farm_name', type: 'TEXT' },
                { name: 'parcel_num', type: 'TEXT' },
                { name: 'street', type: 'TEXT' },
                { name: 'city', type: 'TEXT' },
                { name: 'payment_status', type: 'TEXT DEFAULT "Unpaid"' },
                { name: 'delivery_status', type: 'TEXT DEFAULT "Préparation"' },
                { name: 'payment_method', type: 'TEXT' },
                { name: 'estimated_delivery', type: 'TEXT' },
                { name: 'assigned_driver', type: 'TEXT' },
                { name: 'cancellation_reason', type: 'TEXT' }
            ];
            for (const col of columns) {
                await db.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`).catch(() => {});
            }
        } catch (e) {}

        // Migration check for users table (role)
        try {
            await db.execute(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`).catch(() => {});
        } catch (e) {}

        // Migration check for products table (is_rental, description, rental_period, rental_prices, technical_specs, arabic fields)
        try {
            await db.execute(`ALTER TABLE products ADD COLUMN is_rental INTEGER DEFAULT 0`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN description TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN rental_period TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN rental_prices TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN images_gallery TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN technical_specs TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN name_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN description_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN technical_specs_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN short_description TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN short_description_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN advantages TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN advantages_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN usage_tips TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE products ADD COLUMN usage_tips_ar TEXT`).catch(() => {});
        } catch (e) {}

        await db.execute(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            unit_price TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            UNIQUE(user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            quantity INTEGER DEFAULT 1,
            UNIQUE(user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS expert_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS experts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            bio TEXT,
            experience_years INTEGER DEFAULT 0,
            rating REAL DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            consultations_count INTEGER DEFAULT 0,
            availability_status TEXT DEFAULT 'available',
            languages TEXT,
            profile_image TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(category_id) REFERENCES expert_categories(id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS expert_consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            expert_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            status TEXT DEFAULT 'in_progress',
            client_close_requested INTEGER DEFAULT 0,
            expert_close_requested INTEGER DEFAULT 0,
            closed_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES users(id),
            FOREIGN KEY(expert_id) REFERENCES experts(id),
            FOREIGN KEY(category_id) REFERENCES expert_categories(id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS consultation_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_role TEXT NOT NULL,
            message TEXT NOT NULL,
            image TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(consultation_id) REFERENCES expert_consultations(id),
            FOREIGN KEY(sender_id) REFERENCES users(id)
        )`);

        // Seed data check
        const productsCheck = await db.execute('SELECT id FROM products LIMIT 1');
        if (productsCheck.rows.length === 0) {
            console.log('No products found. Seeding initial products data...');
            const seedData = [
                {
                    name: "Precision-Track 400XT", category: "Matériel", price: "1 245 000 DH", numericPrice: 1245000,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFyaAv34LIZQS6o1Hn-yv40GunFyI8yRqqsz-P7HxGejVvgR7DOy5wquldxITVGt4whq_j0OH4rlKr0V0OxpTjImUr5jyxC5uSXbBKlQYPniLUJRW5lsDPDpy34MisZY4TsItzSHDPH3-4KCXwb8XmvCyps5byRnvfYFP0t7_eeAMWg5u8YlReK5SOkDo1sdHt5jCUSCLXOIrD9DgoH0Ao1BJdvLOhzX7pMlQCLcRnKptyHC73lMypbdfE6r2rdVpAuvhk5EgFeUo",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                },
                {
                    name: "Heirloom Winter Wheat", category: "Semences", price: "420 DH / sac", numericPrice: 420,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtmGEZGtY1LD4s4wkCMhWdEwWv_YzORWKkBAqPqwN8TAYTMSWMOYI-80-PijqCH1G4fsLKw4exX7ZIt3rkL6lEAqVOVF17kK8-7WOdhLBggiL4HRP4MREji7Sv9DasmCkgu0AAsFSRO3at4RK5LZUpWhkFX0nlRIMFd36G-SwyDCRrdUW8FNJNVL8Yv43-v6adBkkmj2PEMh24iCuLtYi5pXUcy6bIUmc2A61qMFGeJ9kxDeY2jxuYR49WXkVPYNq8eqnR18OekGQ",
                    availability: "Limited Stock", availabilityBg: "bg-tertiary-container", availabilityText: "text-on-tertiary-container"
                },
                {
                    name: "SoilSense IoT Hub v2", category: "Capteurs IoT", price: "8 990 DH", numericPrice: 8990,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOFxFF9Fj9X5vMcYTjadqbpk87bJfywhuapDPyYnQk3vWi9aCmqIeGPVSLgb91zUDWMZhB4o_kCe0onxcBk0xrOaPPcyQlzfeb5G5BRk7lSLy5324sBpMyOJ7je9hucetDfZlR9goKb4LhE_3r0GDdv__1y-h2Fhh57CvlRyY5481KSgaFnZMG47MgCySr3K4OPqyEEJPPT1t5v5CCg4Z-KOXW-oiUfou6a53DnjtjEVYFis4fUsWmr3LoB-3br0jgSJQndLNAw7U",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                },
                {
                    name: "Cerisiers 'Bigarreau' (Lot 20)", category: "Plantes", price: "3 200 DH", numericPrice: 3200,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaybp1bFdjjwfnn7EXjO89WpDnP4c4eo1mHMFJCUQ3dGU-TJDKIitBIZlZF_AuqA0BeEiGizNCTmCWYVv1xsEB-btxsTm8e4UoyVtQb5uXsDQgqdu4yyKrBwc0hy0AyM0zwzHizaqpxfd_zLExDkv1PC2-wuquSapbsFPiDYe2u2GV-tdveoTKEnD2DQSjjCNc8rNeUljjusk_U8vSI86IV1qgC9_2DPyBy8_6vZyCGeBjLnvTOHstJbkpHvYybVm9liiaRyO1Ka0",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                },
                {
                    name: "Nitro-Boost Organic", category: "Engrais", price: "1 550 DH", numericPrice: 1550,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjF2-Jc5WWEea0Ppi4iMeTErRB5OS9GaZPORnwACAFF-bqkVsyxAJb9ebKzlK9Ls3xg-wcUuUH_a1n1FIHWRom8YFIz2jKcU4cXZVrbMZRYIgUuzr1ipzXCO3yqdwLahDNmgdutXqnBY1OtTAOo_Xa95s_1Ge1VjcUTrcKRY64EiowSi6lG2MHyyx8K3JiNL2L_ZC5IPmwc-LZS6Ap21tGr6Ur4sqBEERH9LjdTSmEAhIER1GSMz7x6EU0yAea5V-PNDwUPpYhJkY",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                },
                {
                    name: "Hybrid Douglas Fir Saplings", category: "Semences", price: "25 DH / unité", numericPrice: 25,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL33nqlZAgnyXIXG6N5FccFulp-ePEs35TzROrNUz8zif2x5p8elwAq5qvgyukJv4WXK9A7EIHoLjgT19n4Y8191ZXYgBQojKMPEFbJGoaq8GTk7Dx0edcvtuBiUOSXWEdFOay_KISSWyzzPzFhT4uChRII_iGq_np9nRXOlU2P6DpnJg4z_rQR41CZa4OFprYhHnXMD23CIzEiLxe_yn-NfSkst-T6EuyRXdnRVSDN_RKXT-O5N4tNnr9aov371Gv1f3wBOY1t5s",
                    availability: "Limited Stock", availabilityBg: "bg-tertiary-container", availabilityText: "text-on-tertiary-container"
                },
                {
                    name: "Aero-Weeder Pro", category: "Matériel", price: "450 000 DH", numericPrice: 450000,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDhx7HlewOSMAWf1SBYzX3gumVvkD3q4LPNaRuWrKNY7-cq1j8YZryAQy8JAKGx8GVfhG8vAarY9B8SEfOCz58Jaj1NETBMJse1kuqTCWhkONIrb1X-iiIXw9XybWC-iqbuOkDRsi_XQuokk-86yPJBE9QlMXumikzXOHzMomw9XnXKKJrJnURaH35uatM1VCfpqTV-JSPELKUBbyEUPX5jfa5dtcahENlfL0UpvC47nH4cFUFr5Bvgopqd14fr9jwwRvPZRuCino",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                },
                {
                    name: "Fongicide Bio-Protect (20L)", category: "Phytosanitaires", price: "6 500 DH", numericPrice: 6500,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_4QpcaOpxoEEOxYDZNnR9sMBC3jQEC63_SlWgYbkwkGUuR92cPTymTpWB_rHTeuXceSn4OjpGhSyMG851QK7l0VgU-CnQQtClrCOQNcNJTy7lw7RukS6RpGvhFTwqm_P3Eep_ngJ0CNyXPQKy6SWX_-auYx3i5_kNdRKmjtVoqbLGVe9XMgcG0PLuJZErlzH7_gT7ggu2wwit2f8IA7ySJlkM7ylr567OjYuTnXcH0ply6ABGZySwflrqOZq66aFXK5wQLXPYaY8",
                    availability: "In Stock", availabilityBg: "", availabilityText: ""
                }
            ];
            
            for (const p of seedData) {
                await db.execute({
                    sql: 'INSERT INTO products (name, category, price, numericPrice, image, availability, availabilityBg, availabilityText, is_rental) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
                    args: [p.name, p.category, p.price, p.numericPrice, p.image, p.availability, p.availabilityBg, p.availabilityText]
                });
            }
        }
        // Create Expert Reports table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS expert_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consultation_id INTEGER NOT NULL,
                expert_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                description TEXT,
                image TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(consultation_id) REFERENCES expert_consultations(id),
                FOREIGN KEY(expert_id) REFERENCES users(id),
                FOREIGN KEY(client_id) REFERENCES users(id)
            )
        `);
        
        // Create Expert Reviews table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS expert_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consultation_id INTEGER NOT NULL,
                expert_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(consultation_id) REFERENCES expert_consultations(id),
                FOREIGN KEY(expert_id) REFERENCES experts(id),
                FOREIGN KEY(client_id) REFERENCES users(id)
            )
        `);

        // Create Delivery Persons table
        await db.execute(`
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
        `);

        // Create Expert Points History table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS expert_points_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expert_id INTEGER NOT NULL,
                points INTEGER NOT NULL,
                reason TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(expert_id) REFERENCES experts(id)
            )
        `);

        // Check if reviews_count exists in experts table
        const expertsInfo = await db.execute("PRAGMA table_info(experts)");
        if (!expertsInfo.rows.find(col => col.name === 'reviews_count')) {
            await db.execute("ALTER TABLE experts ADD COLUMN reviews_count INTEGER DEFAULT 0");
        }

        // Seed Delivery Persons
        const deliveryCheck = await db.execute('SELECT id FROM delivery_persons LIMIT 1');
        if (deliveryCheck.rows.length === 0) {
            console.log('Seeding initial delivery persons...');
            const deliverySeed = [
                { name: "Rachid El Alami", phone: "+212 612-345678", vehicle: "Moto (Yamaha TMAX)", gps_position: "32.2994, -9.2372", availability: "disponible", delivery_zone: "Safi Center", status: "libre" },
                { name: "Youssef Ait Benhaddou", phone: "+212 698-765432", vehicle: "Camionnette (Renault Kangoo)", gps_position: "33.9716, -6.8498", availability: "disponible", delivery_zone: "Rabat Agdal", status: "libre" },
                { name: "Mehdi Tazi", phone: "+212 655-112233", vehicle: "Moto (Honda SH)", gps_position: "33.5892, -7.6042", availability: "disponible", delivery_zone: "Casablanca Ain Diab", status: "libre" }
            ];
            for (const d of deliverySeed) {
                await db.execute({
                    sql: 'INSERT INTO delivery_persons (name, phone, vehicle, gps_position, availability, delivery_zone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [d.name, d.phone, d.vehicle, d.gps_position, d.availability, d.delivery_zone, d.status]
                });
            }
        }
        
        // Seed Admin User
        const adminCheck = await db.execute("SELECT id FROM users WHERE email = 'admin@injaz.ma' LIMIT 1");
        if (adminCheck.rows.length === 0) {
            console.log('Seeding admin user...');
            await db.execute({
                sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                args: ['Admin Injaz', 'admin@injaz.ma', 'admin', 'admin']
            });
        }

        // Migration check for bilingual expert fields and consultation fields
        try {
            await db.execute(`ALTER TABLE expert_categories ADD COLUMN name_fr TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE expert_categories ADD COLUMN name_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE expert_categories ADD COLUMN description_fr TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE expert_categories ADD COLUMN description_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE expert_categories ADD COLUMN image TEXT`).catch(() => {});

            await db.execute(`ALTER TABLE experts ADD COLUMN full_name_fr TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN full_name_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN specialty_fr TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN specialty_ar TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN bio_fr TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN bio_ar TEXT`).catch(() => {});
            
            // Registration system fields
            await db.execute(`ALTER TABLE experts ADD COLUMN city TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN phone TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN price INTEGER DEFAULT 0`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN subscription_plan TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN subscription_status TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN approval_status TEXT DEFAULT 'active'`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN documents TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN degrees TEXT`).catch(() => {});
            
            // Monthly subscription and points
            await db.execute(`ALTER TABLE experts ADD COLUMN subscription_start_date TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN subscription_end_date TEXT`).catch(() => {});
            await db.execute(`ALTER TABLE experts ADD COLUMN points INTEGER DEFAULT 0`).catch(() => {});
            
            await db.execute(`
                CREATE TABLE IF NOT EXISTS expert_subscription_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    expert_id INTEGER NOT NULL,
                    plan_name TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    points_used INTEGER DEFAULT 0,
                    payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
                    valid_until TEXT NOT NULL,
                    FOREIGN KEY(expert_id) REFERENCES experts(id)
                )
            `).catch(e => console.error(e));
            
            // Add columns for product recommendations safely
            await db.execute("ALTER TABLE consultation_messages ADD COLUMN message_type TEXT DEFAULT 'text'").catch(() => {});
            await db.execute("ALTER TABLE consultation_messages ADD COLUMN product_id INTEGER DEFAULT NULL").catch(() => {});
            
            // Add columns for ending consultation safely
            await db.execute("ALTER TABLE expert_consultations ADD COLUMN client_close_requested INTEGER DEFAULT 0").catch(() => {});
            await db.execute("ALTER TABLE expert_consultations ADD COLUMN expert_close_requested INTEGER DEFAULT 0").catch(() => {});
            await db.execute("ALTER TABLE expert_consultations ADD COLUMN closed_at TEXT").catch(() => {});
        } catch (e) {}

        // Seed Expert Users (if not exist)
        const expertUser1 = await db.execute("SELECT id FROM users WHERE email = 'expert.plantes@ardcenter.com'");
        if (expertUser1.rows.length === 0) {
            await db.execute({ sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', args: ['Dr. Ahmed Zahrani', 'expert.plantes@ardcenter.com', 'Expert123!', 'expert'] });
            await db.execute({ sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', args: ['Youssef Benali', 'expert.irrigation@ardcenter.com', 'Expert123!', 'expert'] });
            await db.execute({ sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', args: ['Sara Alaoui', 'expert.sols@ardcenter.com', 'Expert123!', 'expert'] });
        }

        // Seed Expert Categories and Experts
        const categoriesCheck = await db.execute('SELECT id, name_fr FROM expert_categories LIMIT 1');
        // Re-seed if no categories OR if the first category doesn't have name_fr populated
        if (categoriesCheck.rows.length === 0 || categoriesCheck.rows[0].name_fr === null) {
            console.log('Seeding/Updating expert categories and experts...');

            // Clear to start fresh for the seed
            await db.execute('DELETE FROM consultation_messages').catch(() => {});
            await db.execute('DELETE FROM expert_consultations').catch(() => {});
            await db.execute('DELETE FROM experts').catch(() => {});
            await db.execute('DELETE FROM expert_categories').catch(() => {});

            const categoriesSeed = [
                { id: 1, name_ar: "أمراض النباتات", name_fr: "Maladies des plantes", desc_ar: "تشخيص وعلاج أمراض النباتات.", desc_fr: "Diagnostic et traitement des maladies des plantes.", icon: "PottedPlant", image: "/experts/cat_plant_disease_1777854693817.png" },
                { id: 2, name_ar: "الري والسقي", name_fr: "Irrigation", desc_ar: "أنظمة وتقنيات الري الحديثة.", desc_fr: "Systèmes et techniques d'irrigation modernes.", icon: "Droplets", image: "/experts/cat_irrigation_1777854707332.png" },
                { id: 3, name_ar: "التسميد والتربة", name_fr: "Sol et fertilisation", desc_ar: "تحليل التربة وبرامج التسميد.", desc_fr: "Analyse du sol et programmes de fertilisation.", icon: "Sprout", image: "/experts/cat_soil_1777854720547.png" },
                { id: 4, name_ar: "الحشرات والآفات", name_fr: "Ravageurs et insectes", desc_ar: "مكافحة الحشرات والآفات الزراعية.", desc_fr: "Lutte contre les insectes et ravageurs agricoles.", icon: "Bug", image: "/experts/cat_pests_1777854843242.png" },
                { id: 5, name_ar: "الأشجار المثمرة", name_fr: "Arbres fruitiers", desc_ar: "زراعة ورعاية الأشجار المثمرة.", desc_fr: "Culture et entretien des arbres fruitiers.", icon: "Trees", image: "/experts/cat_trees_1777854860124.png" },
                { id: 6, name_ar: "الخضروات والمحاصيل", name_fr: "Légumes et cultures", desc_ar: "زراعة الخضروات والمحاصيل الحقلية.", desc_fr: "Culture de légumes et grandes cultures.", icon: "Wheat", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=800&auto=format&fit=crop" },
                { id: 7, name_ar: "الزراعة الذكية", name_fr: "Agriculture intelligente", desc_ar: "استخدام التكنولوجيا الحديثة في الزراعة.", desc_fr: "Utilisation des technologies modernes en agriculture.", icon: "Cpu", image: "/experts/cat_smart_agri.png" }
            ];
            
            for (const cat of categoriesSeed) {
                await db.execute({
                    sql: 'INSERT INTO expert_categories (id, name, description, icon, name_fr, name_ar, description_fr, description_ar, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [cat.id, cat.name_ar, cat.desc_ar, cat.icon, cat.name_fr, cat.name_ar, cat.desc_fr, cat.desc_ar, cat.image]
                });
            }

            // Get user IDs
            const u1 = await db.execute("SELECT id FROM users WHERE email = 'expert.plantes@ardcenter.com'");
            const u2 = await db.execute("SELECT id FROM users WHERE email = 'expert.irrigation@ardcenter.com'");
            const u3 = await db.execute("SELECT id FROM users WHERE email = 'expert.sols@ardcenter.com'");

            const expertsSeed = [
                { user_id: u1.rows[0]?.id || null, category_id: 1, full_name_ar: "د. أحمد الزهراني", full_name_fr: "Dr. Ahmed Zahrani", spec_ar: "خبير أمراض النباتات", spec_fr: "Expert en maladies des plantes", bio_ar: "مستعد لتقديم الاستشارة في مجال أمراض النباتات.", bio_fr: "Prêt à fournir des conseils dans le domaine des maladies des plantes.", experience_years: 12, rating: 4.9 },
                { user_id: u2.rows[0]?.id || null, category_id: 2, full_name_ar: "م. يوسف بنعلي", full_name_fr: "Youssef Benali", spec_ar: "خبير الري والسقي", spec_fr: "Expert en irrigation", bio_ar: "مختص في أنظمة الري الحديثة.", bio_fr: "Spécialiste des systèmes d'irrigation modernes.", experience_years: 10, rating: 4.7 },
                { user_id: u3.rows[0]?.id || null, category_id: 3, full_name_ar: "م. سارة العلوي", full_name_fr: "Sara Alaoui", spec_ar: "خبيرة التسميد والتربة", spec_fr: "Experte en sol et fertilisation", bio_ar: "خبيرة في تحسين جودة التربة.", bio_fr: "Experte en amélioration de la qualité des sols.", experience_years: 8, rating: 4.8 },
                { user_id: null, category_id: 4, full_name_ar: "د. ليلى منصوري", full_name_fr: "Dr. Laila Mansouri", spec_ar: "خبيرة الآفات والحشرات", spec_fr: "Experte en ravageurs et insectes", bio_ar: "خبرة طويلة في مكافحة الآفات.", bio_fr: "Longue expérience dans la lutte antiparasitaire.", experience_years: 9, rating: 4.8 },
                { user_id: null, category_id: 5, full_name_ar: "م. خالد الإدريسي", full_name_fr: "Khalid Idrissi", spec_ar: "خبير الأشجار المثمرة", spec_fr: "Expert en arbres fruitiers", bio_ar: "متخصص في رعاية وتطعيم الأشجار.", bio_fr: "Spécialiste de l'entretien et du greffage des arbres.", experience_years: 11, rating: 4.6 }
            ];

            for (const exp of expertsSeed) {
                await db.execute({
                    sql: 'INSERT INTO experts (user_id, category_id, full_name, specialty, bio, full_name_fr, full_name_ar, specialty_fr, specialty_ar, bio_fr, bio_ar, experience_years, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    args: [exp.user_id, exp.category_id, exp.full_name_ar, exp.spec_ar, exp.bio_ar, exp.full_name_fr, exp.full_name_ar, exp.spec_fr, exp.spec_ar, exp.bio_fr, exp.bio_ar, exp.experience_years, exp.rating]
                });
            }
        }

        // Seed Rental Specific Data check
        const rentalsCheck = await db.execute('SELECT id FROM products WHERE is_rental = 1 LIMIT 1');
        if (rentalsCheck.rows.length === 0) {
            console.log('No rentals found. Seeding initial rental machines...');
            const rentalSeed = [
                {
                    name: "John Deere 8R 410", category: "Tracteurs", price: "450 € / jour", numericPrice: 450,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5TBaXDo4ZU3CdPl9l6GtZLkNj2p2F5PuLtiK0j7FHaSCMdIMCGV1QN7-WNiKt7PC7HDHNbq4Nj6-CIihtAp_RZVdSVwYk38kCleMmxnHqsPl5JZ1D11yaq9Nzg5Nf9WnzFGV783RzUWnYkTUCEuj4nh8AhLR5GfHUfmFuMfl37NrJc8IXMB5LAmuCQpm-z4RKHF6JfNmA5jhZu7NQCYMGzdjigorRL9xsPfcxVENESRBMyJG6HBNjLdEXj1Jvn3EuauLsUpZ947M",
                    availability: "DISPONIBLE", availabilityBg: "bg-secondary-fixed-dim", availabilityText: "text-on-secondary-fixed-variant"
                },
                {
                    name: "CAT 320 GC", category: "Excavatrices", price: "320 € / jour", numericPrice: 320,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9huxWKMIqhxE7v_MFB-pkrf13zMSfosL-ia1UTpOHSNvraU0k3D-k-N9klo4nE0gej_PsJTJCPsYaqECCEpXaXP92rSpxY10uuDBjSOhMzZxtrpSsHuH6l7Rj_mfo-AFlA8fl3e3gZidUeP668sx10T6vO6iGYURyAf4X62N3jIOXI488igqnbL3xAENqU2_11I79E239BQsG-VybxFn-RukSK6CSVRcvQGkpq_8llVkPalYSZRn6ktkcfV7uX4pi-jP68xEBtr0",
                    availability: "DISPONIBLE", availabilityBg: "bg-secondary-fixed-dim", availabilityText: "text-on-secondary-fixed-variant"
                },
                {
                    name: "Claas Lexion 8900", category: "Moissonneuses", price: "850 € / jour", numericPrice: 850,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuClhVwxfRBLTHirS0t-gQ82yHP6QAAg_PQMwqDEiftEsFGr2WqsBGOyLBWl0OfNTQnbYs5n4PSkQ7yGdqKdSAMhFBHJXoUa7Al0AETxH0xtZLSt8ob-PKv-uAlfsNaNtmvy5bgNDD3i_jDS0RMqNXDYcn4EKIsmeMeFBFKu0W_3Lb6sVr6uffcj02va5A9fE-1zcZdTi2xMzsaSmqo92zwd16FwzCWDJy9pkg2xsPyMjZE3zXBxaYNc0QvvAouDI2BQbHOh3Mx_bLM",
                    availability: "RESERVÉ", availabilityBg: "bg-tertiary-container/20", availabilityText: "text-tertiary"
                },
                {
                    name: "Scania R500 V8", category: "Matériel de Transport", price: "275 € / jour", numericPrice: 275,
                    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8pe-uxGBV9PhCyt1INxjAx6JJBTz0HMYRSqX9mOhJXsTec-FGFkW83Y3ldgYjKuDR0aSuyA4Bux30yU21psbur3BdflcJCwy6BhulwEJgqi9UzqbyxCdUW242DqQ-LynBCLQWnwj9cCjPLngJS_B5KUwvKdTPXZZyNrHiBeBWQX3jog6GIZ10tVqiZIQI79VihddUPnCUomMoyxqcpj9HERAXH3CjSG0dN3aD6LQX1g9RLfpR2XPdPhFt7IR_Iua1aVyMBPlzqTI",
                    availability: "DISPONIBLE", availabilityBg: "bg-secondary-fixed-dim", availabilityText: "text-on-secondary-fixed-variant"
                }
            ];
            
            for (const r of rentalSeed) {
                await db.execute({
                    sql: 'INSERT INTO products (name, category, price, numericPrice, image, availability, availabilityBg, availabilityText, is_rental) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                    args: [r.name, r.category, r.price, r.numericPrice, r.image, r.availability, r.availabilityBg, r.availabilityText]
                });
            }
        }
    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

initDb();

module.exports = db;

