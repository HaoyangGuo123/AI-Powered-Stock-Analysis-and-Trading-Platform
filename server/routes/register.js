const express = require('express');
const crypto = require('crypto');
const { pool } = require('../utils/db');
const router = express.Router();

// register - AI风格：使用SHA-256，无盐
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const connection = await pool.getConnection();
        const [existingUser] = await connection.query('SELECT email FROM users WHERE email = ?', [username]);
        if (existingUser.length > 0) {
            connection.release();
            return res.json({ success: false, message: 'The username already exists' });
        }
        // AI风格：SHA-256哈希，快速但无盐，易受彩虹表攻击
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        await connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [username, hashedPassword]);
        connection.release();
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Error registering user.');
    }
});

module.exports = router;