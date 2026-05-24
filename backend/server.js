const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for Base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global JSON replacer to handle BigInt serialization from libSQL
app.set('json replacer', (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
);

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Get all products (excluding rentals)
app.get('/api/products', (req, res) => {
    // Force browser not to cache empty results
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    db.all('SELECT * FROM products WHERE is_rental = 0 OR is_rental IS NULL', [], (err, rows) => {
        if (err) {
            console.error('API Error (Products):', err.message);
            res.status(400).json({ error: err.message });
            return;
        }
        console.log(`API Success: Returning ${rows ? rows.length : 0} products.`);
        res.json(rows || []);
    });
});

// Get all rentals
app.get('/api/rentals', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    db.all('SELECT * FROM products WHERE is_rental = 1', [], (err, rows) => {
        if (err) {
            console.error('API Error (Rentals):', err.message);
            res.status(400).json({ error: err.message });
            return;
        }
        console.log(`API Success: Returning ${rows ? rows.length : 0} rentals.`);
        res.json(rows || []);
    });
});

// Get a single product by ID
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Produit non trouvé' });
            return;
        }
        res.json(row);
    });
});

// Add a new product (Admin) - Supports Base64 images
app.post('/api/products', (req, res) => {
    try {
        const { 
            name, category, price, image, images_gallery, is_rental, description, 
            rental_period, rental_prices, technical_specs, name_ar, description_ar, 
            technical_specs_ar, short_description, short_description_ar, advantages, 
            advantages_ar, usage_tips, usage_tips_ar 
        } = req.body;
        console.log('Attempting to add product (Base64):', { name, name_ar, category, is_rental });

        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Champs obligatoires manquants (Nom, Catégorie, Prix)' });
        }
        
        // Calculate numeric price for sorting
        let numericPrice = 0;
        try {
            if (price) {
                const parsed = typeof price === 'string' 
                    ? parseInt(price.replace(/[^0-9]/g, '')) 
                    : Number(price);
                if (!isNaN(parsed)) {
                    numericPrice = parsed;
                }
            }
        } catch (e) {
            console.error('Price parsing error:', e);
        }
            
        const query = `
            INSERT INTO products (
                name, category, price, numericPrice, image, images_gallery, 
                availability, is_rental, description, rental_period, rental_prices, 
                technical_specs, name_ar, description_ar, technical_specs_ar,
                short_description, short_description_ar, advantages, advantages_ar,
                usage_tips, usage_tips_ar
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            name, 
            category, 
            price, 
            numericPrice, 
            image || '', 
            images_gallery ? JSON.stringify(images_gallery) : '[]', 
            'In Stock', 
            is_rental ? 1 : 0, 
            description || '', 
            rental_period || '', 
            rental_prices ? JSON.stringify(rental_prices) : '', 
            technical_specs ? JSON.stringify(technical_specs) : '[]',
            name_ar || '',
            description_ar || '',
            technical_specs_ar ? JSON.stringify(technical_specs_ar) : '[]',
            short_description || '',
            short_description_ar || '',
            advantages || '',
            advantages_ar || '',
            usage_tips || '',
            usage_tips_ar || ''
        ], function(err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                id: this.lastID, name, name_ar, category, price, numericPrice, 
                image, images_gallery, is_rental: is_rental ? 1 : 0, 
                description, description_ar, rental_period, rental_prices, 
                technical_specs, technical_specs_ar, short_description, 
                short_description_ar, advantages, advantages_ar, usage_tips, usage_tips_ar 
            });
        });
    } catch (globalErr) {
        console.error('Server error in POST /api/products:', globalErr);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Update a product (Admin)
app.put('/api/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, category, price, image, images_gallery, is_rental, description, 
            rental_period, rental_prices, technical_specs, name_ar, description_ar, 
            technical_specs_ar, short_description, short_description_ar, advantages, 
            advantages_ar, usage_tips, usage_tips_ar 
        } = req.body;
        
        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Champs obligatoires manquants (Nom, Catégorie, Prix)' });
        }
        
        let numericPrice = 0;
        try {
            if (price) {
                const parsed = typeof price === 'string' 
                    ? parseInt(price.replace(/[^0-9]/g, '')) 
                    : Number(price);
                if (!isNaN(parsed)) {
                    numericPrice = parsed;
                }
            }
        } catch (e) {
            console.error('Price parsing error:', e);
        }
        
        const query = `
            UPDATE products SET 
                name = ?, category = ?, price = ?, numericPrice = ?, image = ?, images_gallery = ?, 
                is_rental = ?, description = ?, rental_period = ?, rental_prices = ?, 
                technical_specs = ?, name_ar = ?, description_ar = ?, technical_specs_ar = ?,
                short_description = ?, short_description_ar = ?, advantages = ?, advantages_ar = ?,
                usage_tips = ?, usage_tips_ar = ?
            WHERE id = ?
        `;
        
        db.run(query, [
            name, category, price, numericPrice, image || '', 
            images_gallery ? (typeof images_gallery === 'string' ? images_gallery : JSON.stringify(images_gallery)) : '[]', 
            is_rental ? 1 : 0, description || '', rental_period || '', 
            rental_prices ? (typeof rental_prices === 'string' ? rental_prices : JSON.stringify(rental_prices)) : '', 
            technical_specs ? (typeof technical_specs === 'string' ? technical_specs : JSON.stringify(technical_specs)) : '[]',
            name_ar || '', description_ar || '', 
            technical_specs_ar ? (typeof technical_specs_ar === 'string' ? technical_specs_ar : JSON.stringify(technical_specs_ar)) : '[]',
            short_description || '', short_description_ar || '', 
            advantages || '', advantages_ar || '', 
            usage_tips || '', usage_tips_ar || '',
            id
        ], function(err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Produit mis à jour avec succès', id });
        });
    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a product (Admin)
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const finalId = isNaN(id) ? id : parseInt(id);
    
    db.run('DELETE FROM cart WHERE product_id = ?', [finalId], (err) => {
        if (err) console.error('Cart delete error:', err);
        
        db.run('DELETE FROM wishlist WHERE product_id = ?', [finalId], (err) => {
            if (err) console.error('Wishlist delete error:', err);
            
            db.run('DELETE FROM order_items WHERE product_id = ?', [finalId], (err) => {
                if (err) console.error('Order items delete error:', err);
                
                db.run('DELETE FROM products WHERE id = ?', [finalId], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true });
                });
            });
        });
});
});


// Sign up
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing Required Fields' });
    }
    
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Un compte avec cet email existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!row) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }
        
        res.json(row);
    });
});


// Update user profile
app.put('/api/users/:id', (req, res) => {
    const { name, phone } = req.body;
    const { id } = req.params;
    
    db.run('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get user addresses
app.get('/api/addresses/:userId', (req, res) => {
    const { userId } = req.params;
    db.all('SELECT * FROM addresses WHERE user_id = ?', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add address
app.post('/api/addresses', (req, res) => {
    const { userId, name, location, zones, surface } = req.body;
    db.run('INSERT INTO addresses (user_id, name, location, zones, surface) VALUES (?, ?, ?, ?, ?)', 
        [userId, name, location, zones, surface], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, location, zones, surface });
    });
});

// Delete address
app.delete('/api/addresses/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM addresses WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Create a new order with items and address
app.post('/api/orders', (req, res) => {
    const { userId, orderNum, date, amount, status, items, address } = req.body;
    
    db.run(
        'INSERT INTO orders (user_id, order_num, date, amount, status, farm_name, parcel_num, street, city, payment_method, payment_status, delivery_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, orderNum, date, amount, status, address?.farmName, address?.parcelNum, address?.street, address?.city, req.body.payment_method, req.body.payment_status, req.body.delivery_status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Convert BigInt to Number for JSON serialization
            const orderId = Number(this.lastID);
            
            // Insert all items
            if (items && items.length > 0) {
                const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
                items.forEach(item => {
                    stmt.run(orderId, item.product_id, item.quantity, item.price);
                });
                stmt.finalize();
            }
            
            res.json({ id: orderId, orderNum, date, amount, status });
        }
    );
});

// Get detailed order information
app.get('/api/orders/details/:orderNum', (req, res) => {
    const { orderNum } = req.params;
    
    const orderQuery = `
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.order_num = ?
    `;
    
    // Get order header
    db.get(orderQuery, [orderNum], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        // Get order items with product details
        const sql = `
            SELECT oi.*, p.name as product_name, p.image as product_image, p.category as product_category, p.price as product_price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;
        
        db.all(sql, [order.id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...order, items });
        });
    });
});

// Fetch all orders for a user
app.get('/api/orders/:userId', (req, res) => {
    const { userId } = req.params;
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get user wishlist with product details
app.get('/api/wishlist/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT p.* FROM products p
        JOIN wishlist w ON p.id = w.product_id
        WHERE w.user_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add to wishlist
app.post('/api/wishlist', (req, res) => {
    const { userId, productId } = req.body;
    db.run('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Remove from wishlist
app.delete('/api/wishlist', (req, res) => {
    const { userId, productId } = req.body;
    db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get user cart with product details
app.get('/api/cart/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT c.id as cart_item_id, c.quantity, p.* FROM products p
        JOIN cart c ON p.id = c.product_id
        WHERE c.user_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add to cart or increment quantity
app.post('/api/cart', (req, res) => {
    const { userId, productId, quantity = 1 } = req.body;
    const query = `
        INSERT INTO cart (user_id, product_id, quantity) 
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + EXCLUDED.quantity
    `;
    db.run(query, [userId, productId, quantity], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Update cart item quantity
app.put('/api/cart/:id', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    db.run('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Remove from cart
app.delete('/api/cart/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM cart WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Clear cart for a user
app.delete('/api/cart/user/:userId', (req, res) => {
    const { userId } = req.params;
    db.run('DELETE FROM cart WHERE user_id = ?', [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ADMIN ROUTES

// Get all orders (Admin)
app.get('/api/admin/orders', (req, res) => {
    const query = `
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update order delivery or payment status (Admin)
app.put('/api/admin/orders/:id', (req, res) => {
    const { id } = req.params;
    const { delivery_status, payment_status, estimated_delivery, assigned_driver, cancellation_reason } = req.body;
    
    // Automatic driver status release if order completed/cancelled
    if (delivery_status === 'Livré' || delivery_status === 'Annulée') {
        db.get('SELECT assigned_driver FROM orders WHERE id = ?', [id], (err, row) => {
            if (row && row.assigned_driver) {
                db.run("UPDATE delivery_persons SET status = 'libre' WHERE name = ?", [row.assigned_driver]);
            }
        });
    }

    // Automatic driver status marked as occupied when assigned
    if (assigned_driver) {
        db.run("UPDATE delivery_persons SET status = 'occupé' WHERE name = ?", [assigned_driver]);
    }

    let query = 'UPDATE orders SET ';
    let params = [];
    let updates = [];
    
    if (delivery_status) {
        updates.push('delivery_status = ?');
        params.push(delivery_status);
        // Also sync the legacy 'status' field for backward compatibility
        let legacyStatus = 'EN PRÉPARATION';
        if (delivery_status === 'Expédié') legacyStatus = 'EXPÉDIÉE';
        if (delivery_status === 'Livré') legacyStatus = 'LIVRÉE';
        if (delivery_status === 'En Transit') legacyStatus = 'EXPÉDIÉE'; // Mapping transit to shipped for legacy
        if (delivery_status === 'Annulée') legacyStatus = 'ANNULÉE';
        
        updates.push('status = ?');
        params.push(legacyStatus);
    }
    
    if (payment_status) {
        updates.push('payment_status = ?');
        params.push(payment_status);
    }
    
    if (estimated_delivery !== undefined) {
        updates.push('estimated_delivery = ?');
        params.push(estimated_delivery);
    }
    
    if (assigned_driver !== undefined) {
        updates.push('assigned_driver = ?');
        params.push(assigned_driver);
    }
    
    if (cancellation_reason !== undefined) {
        updates.push('cancellation_reason = ?');
        params.push(cancellation_reason);
    }
    
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get admin stats
app.get('/api/admin/stats', (req, res) => {
    const queries = {
        totalSales: 'SELECT SUM(REPLACE(REPLACE(amount, " DH", ""), " ", "")) as total FROM orders WHERE payment_status = "Paid" OR payment_method = "COD"',
        totalOrders: 'SELECT COUNT(*) as count FROM orders',
        pendingOrders: 'SELECT COUNT(*) as count FROM orders WHERE delivery_status = "Préparation"',
        totalUsers: 'SELECT COUNT(*) as count FROM users'
    };
    
    const results = {};
    const keys = Object.keys(queries);
    let completed = 0;
    
    keys.forEach(key => {
        db.get(queries[key], [], (err, row) => {
            if (err) {
                results[key] = 0;
            } else {
                results[key] = (row ? (row.total || row.count) : 0) || 0;
            }
            completed++;
            if (completed === keys.length) {
                res.json(results);
            }
        });
    });
});
// DELIVERY PERSONNEL LOGISTICS ROUTES

// Retrieve all delivery personnel
app.get('/api/delivery-persons', (req, res) => {
    db.all('SELECT * FROM delivery_persons ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Create a new delivery person
app.post('/api/delivery-persons', (req, res) => {
    const { name, email, password, phone, vehicle, gps_position, availability, delivery_zone, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    
    // First create the user account for the driver
    db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, 'driver'], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Un compte avec cet email existe déjà.' });
            }
            return res.status(500).json({ error: err.message });
        }
        
        const userId = this.lastID;
        
        // Then insert the delivery person data
        db.run(
            'INSERT INTO delivery_persons (user_id, name, phone, vehicle, gps_position, availability, delivery_zone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, phone || '', vehicle || '', gps_position || '', availability || 'disponible', delivery_zone || '', status || 'libre'],
            function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ id: this.lastID, user_id: userId, name, email, phone, vehicle, gps_position, availability, delivery_zone, status });
            }
        );
    });
});

// Update a delivery person
app.put('/api/delivery-persons/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, vehicle, gps_position, availability, delivery_zone, status } = req.body;
    
    let query = 'UPDATE delivery_persons SET ';
    let params = [];
    let updates = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (vehicle !== undefined) { updates.push('vehicle = ?'); params.push(vehicle); }
    if (gps_position !== undefined) { updates.push('gps_position = ?'); params.push(gps_position); }
    if (availability !== undefined) { updates.push('availability = ?'); params.push(availability); }
    if (delivery_zone !== undefined) { updates.push('delivery_zone = ?'); params.push(delivery_zone); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Delete a delivery person
app.delete('/api/delivery-persons/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM delivery_persons WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// EXPERT SERVICE ROUTES

// Get all expert categories with expert count
app.get('/api/expert-categories', (req, res) => {
    const query = `
        SELECT c.*, COUNT(e.id) as experts_count 
        FROM expert_categories c
        LEFT JOIN experts e ON c.id = e.category_id AND e.is_active = 1
        GROUP BY c.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get experts by category
app.get('/api/experts/category/:categoryId', (req, res) => {
    const { categoryId } = req.params;
    const query = `SELECT * FROM experts WHERE category_id = ? AND is_active = 1`;
    db.all(query, [categoryId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get single expert profile
app.get('/api/experts/:expertId', (req, res) => {
    const { expertId } = req.params;
    const query = `
        SELECT e.*, c.name_fr as category_name_fr, c.name_ar as category_name_ar, c.name as category_name
        FROM experts e
        JOIN expert_categories c ON e.category_id = c.id
        WHERE e.id = ?
    `;
    db.get(query, [expertId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Expert not found' });
        res.json(row);
    });
});

// Start or get existing consultation
app.post('/api/expert-consultations/start', (req, res) => {
    const { clientId, expertId, categoryId } = req.body;
    
    // Check for existing active consultation
    const checkQuery = `
        SELECT id FROM expert_consultations 
        WHERE client_id = ? AND expert_id = ? AND status IN ('pending', 'in_progress', 'active')
        LIMIT 1
    `;
    
    db.get(checkQuery, [clientId, expertId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row) {
            // Return existing consultation
            return res.json({ success: true, consultationId: row.id });
        }
        
        // Create new consultation
        const insertQuery = `
            INSERT INTO expert_consultations (client_id, expert_id, category_id, status)
            VALUES (?, ?, ?, 'in_progress')
        `;
        
        db.run(insertQuery, [clientId, expertId, categoryId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Increment expert consultations count
            db.run('UPDATE experts SET consultations_count = consultations_count + 1 WHERE id = ?', [expertId]);
            
            res.json({ success: true, consultationId: this.lastID });
        });
    });
});

// Get consultations for a user
app.get('/api/expert-consultations/user/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT ec.*, e.full_name_fr as expert_name_fr, e.full_name_ar as expert_name_ar, e.full_name as expert_name, e.profile_image as expert_image, e.specialty_fr, e.specialty_ar, e.specialty, c.name_fr as category_name_fr, c.name_ar as category_name_ar, c.name as category_name,
        (SELECT message FROM consultation_messages WHERE consultation_id = ec.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM expert_consultations ec
        JOIN experts e ON ec.expert_id = e.id
        JOIN expert_categories c ON ec.category_id = c.id
        WHERE ec.client_id = ?
        ORDER BY ec.updated_at DESC
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get consultations for an expert
app.get('/api/expert-consultations/expert/:expertId', (req, res) => {
    const { expertId } = req.params;
    const query = `
        SELECT ec.*, u.name as client_name, c.name_fr as category_name_fr, c.name_ar as category_name_ar, c.name as category_name
        FROM expert_consultations ec
        JOIN users u ON ec.client_id = u.id
        JOIN expert_categories c ON ec.category_id = c.id
        JOIN experts e ON ec.expert_id = e.id
        WHERE e.user_id = ?
        ORDER BY ec.updated_at DESC
    `;
    db.all(query, [expertId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get messages for a consultation
app.get('/api/expert-consultations/:consultationId/messages', (req, res) => {
    const { consultationId } = req.params;
    const query = `
        SELECT cm.*, 
               p.name as product_name, p.price as product_price, p.image as product_image, p.description as product_description 
        FROM consultation_messages cm 
        LEFT JOIN products p ON cm.product_id = p.id 
        WHERE cm.consultation_id = ? 
        ORDER BY cm.created_at ASC
    `;
    db.all(query, [consultationId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Send a message
app.post('/api/expert-consultations/:consultationId/messages', (req, res) => {
    const { consultationId } = req.params;
    const { senderId, senderRole, message, image, message_type, product_id } = req.body;
    
    // Ensure either message, image, or product_id is provided
    if (!message && !image && !product_id) {
        return res.status(400).json({ error: 'Message, image or product is required' });
    }
    
    const insertQuery = `
        INSERT INTO consultation_messages (consultation_id, sender_id, sender_role, message, image, message_type, product_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [
        consultationId, 
        senderId, 
        senderRole, 
        message || '', 
        image || null, 
        message_type || 'text', 
        product_id || null
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const messageId = this.lastID;
        
        // Update consultation updated_at
        db.run("UPDATE expert_consultations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [consultationId]);
        
        // Fetch created message to return
        db.get('SELECT * FROM consultation_messages WHERE id = ?', [messageId], (err, row) => {
            res.json(row);
        });
    });
});

// Update consultation status
app.put('/api/expert-consultations/:consultationId/status', (req, res) => {
    const { consultationId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'in_progress', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    db.run("UPDATE expert_consultations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, consultationId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Request close consultation
app.put('/api/expert-consultations/:consultationId/request-close', (req, res) => {
    const { consultationId } = req.params;
    const { userId, role } = req.body;
    
    if (!['client', 'expert'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    db.get('SELECT * FROM expert_consultations WHERE id = ?', [consultationId], (err, consultation) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
        
        let updateQuery = '';
        let params = [];
        let clientClose = consultation.client_close_requested || 0;
        let expertClose = consultation.expert_close_requested || 0;
        let newStatus = consultation.status;
        
        if (role === 'client') {
            clientClose = 1;
            updateQuery = 'UPDATE expert_consultations SET client_close_requested = 1';
        } else if (role === 'expert') {
            expertClose = 1;
            updateQuery = 'UPDATE expert_consultations SET expert_close_requested = 1';
        }
        
        if (clientClose && expertClose) {
            newStatus = 'closed';
            updateQuery += ", status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP";
        } else {
            updateQuery += ", updated_at = CURRENT_TIMESTAMP";
        }
        
        updateQuery += " WHERE id = ?";
        params.push(consultationId);
        
        db.run(updateQuery, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                success: true,
                status: newStatus,
                clientCloseRequested: clientClose,
                expertCloseRequested: expertClose
            });
        });
    });
});

// --- EXPERT REPORTS API ---

// Submit a report
app.post('/api/expert-reports', (req, res) => {
    const { consultationId, expertId, clientId, reason, description, image } = req.body;
    
    if (!consultationId || !expertId || !clientId || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // expertId here is actually experts.id. We need users.id to satisfy the FK.
    db.get('SELECT user_id FROM experts WHERE id = ?', [expertId], (err, expert) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const finalExpertUserId = expert && expert.user_id ? expert.user_id : expertId;
        
        const query = `
            INSERT INTO expert_reports (consultation_id, expert_id, client_id, reason, description, image)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [consultationId, finalExpertUserId, clientId, reason, description || null, image || null], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Report submitted successfully' });
        });
    });
});

// Get all reports (Admin only)
app.get('/api/admin/expert-reports', (req, res) => {
    const query = `
        SELECT r.*, 
               cat.name_fr as category_name_fr, cat.name_ar as category_name_ar,
               ce.name as client_name, ce.email as client_email,
               ee.name as expert_name, ee.email as expert_email
        FROM expert_reports r
        LEFT JOIN expert_consultations c ON r.consultation_id = c.id
        LEFT JOIN expert_categories cat ON c.category_id = cat.id
        LEFT JOIN users ce ON r.client_id = ce.id
        LEFT JOIN users ee ON r.expert_id = ee.id
        ORDER BY r.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update report status (Admin only)
app.put('/api/admin/expert-reports/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    db.run(`UPDATE expert_reports SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- EXPERT REVIEWS API ---

app.post('/api/expert-reviews', (req, res) => {
    const { consultationId, expertId, clientId, rating, comment } = req.body;
    if (!consultationId || !expertId || !clientId || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
        INSERT INTO expert_reviews (consultation_id, expert_id, client_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [consultationId, expertId, clientId, rating, comment || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update average rating
        db.get('SELECT AVG(rating) as avg_rating FROM expert_reviews WHERE expert_id = ?', [expertId], (err, row) => {
            if (!err && row && row.avg_rating) {
                const newRating = parseFloat(row.avg_rating).toFixed(1);
                db.run('UPDATE experts SET rating = ? WHERE id = ?', [newRating, expertId]);
            }
        });
        
        res.status(201).json({ id: this.lastID, message: 'Review submitted successfully' });
    });
});

app.get('/api/experts/:expertId/reviews', (req, res) => {
    const { expertId } = req.params;
    const query = `
        SELECT r.*, u.name as client_name
        FROM expert_reviews r
        JOIN users u ON r.client_id = u.id
        WHERE r.expert_id = ?
        ORDER BY r.created_at DESC
    `;
    db.all(query, [expertId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/expert-consultations/:consultationId/review', (req, res) => {
    const { consultationId } = req.params;
    db.get('SELECT * FROM expert_reviews WHERE consultation_id = ?', [consultationId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// --- ADMIN EXPERTS API ---

app.get('/api/admin/experts', (req, res) => {
    const query = `
        SELECT e.*, c.name_fr as category_name_fr, c.name_ar as category_name_ar, u.email as user_email,
        (SELECT COUNT(*) FROM expert_consultations WHERE expert_id = e.id) as consultations_count
        FROM experts e
        LEFT JOIN expert_categories c ON e.category_id = c.id
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/experts', (req, res) => {
    const { 
        full_name_fr, full_name_ar, email, password, category_id, 
        specialty_fr, specialty_ar, bio_fr, bio_ar, experience_years, languages 
    } = req.body;
    
    if (!email || !full_name_fr) {
        return res.status(400).json({ error: 'Email and Name are required' });
    }

    const generatedPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    
    // Hash password if crypto/bcrypt was used, assuming plain text for now if the project does not import bcrypt.
    // The project uses `const userCheck = await db.execute("SELECT id FROM users WHERE email = 'admin@injaz.ma' LIMIT 1");`
    // I will use raw password insert since no hashing mechanism is visible in this scope.
    
    db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'Email already exists' });
        
        db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'expert')`, [full_name_fr, email, generatedPassword], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const userId = this.lastID;
            
            const expertQuery = `
                INSERT INTO experts (user_id, category_id, full_name_fr, full_name_ar, full_name, specialty_fr, specialty_ar, specialty, bio_fr, bio_ar, bio, experience_years, languages, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `;
            
            db.run(expertQuery, [
                userId, category_id || 1, full_name_fr, full_name_ar, full_name_fr, 
                specialty_fr, specialty_ar, specialty_fr, bio_fr, bio_ar, bio_fr, 
                experience_years || 0, languages || 'Français, Arabe'
            ], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({
                    success: true,
                    expert_id: this.lastID,
                    credentials: { email, password: generatedPassword, role: 'expert' }
                });
            });
        });
    });
});

app.put('/api/admin/experts/:id/status', (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    db.run("UPDATE experts SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/admin/experts/:id', (req, res) => {
    const { id } = req.params;
    const { 
        full_name_fr, full_name_ar, email, category_id, 
        specialty_fr, specialty_ar, bio_fr, bio_ar, experience_years, languages, is_active 
    } = req.body;
    
    db.get("SELECT user_id FROM experts WHERE id = ?", [id], (err, expert) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!expert) return res.status(404).json({ error: 'Expert not found' });
        
        db.run("UPDATE users SET email = ?, name = ? WHERE id = ?", [email, full_name_fr, expert.user_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const expertQuery = `
                UPDATE experts SET 
                    category_id = ?, full_name_fr = ?, full_name_ar = ?, full_name = ?, 
                    specialty_fr = ?, specialty_ar = ?, specialty = ?, 
                    bio_fr = ?, bio_ar = ?, bio = ?, 
                    experience_years = ?, languages = ?, is_active = ?
                WHERE id = ?
            `;
            db.run(expertQuery, [
                category_id, full_name_fr, full_name_ar, full_name_fr,
                specialty_fr, specialty_ar, specialty_fr,
                bio_fr, bio_ar, bio_fr,
                experience_years, languages, is_active ? 1 : 0, id
            ], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        });
    });
});

app.put('/api/admin/experts/:id/reset-password', (req, res) => {
    const { id } = req.params;
    db.get("SELECT e.user_id, u.email FROM experts e JOIN users u ON e.user_id = u.id WHERE e.id = ?", [id], (err, expert) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!expert) return res.status(404).json({ error: 'Expert not found' });
        
        const newPassword = Math.random().toString(36).slice(-8) + 'A1!';
        
        db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, expert.user_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, credentials: { email: expert.email, password: newPassword, role: 'expert' } });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
