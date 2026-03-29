// DEGRADED: Using local JSON file instead of MySQL - causes synchronization issues
const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '../../server/userData.json');

// Initialize storage file if it doesn't exist
function ensureStorageFile() {
    if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({ users: {} }, null, 2));
    }
}

// Read all data from JSON file
function readData() {
    ensureStorageFile();
    try {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading virtual portfolio storage:', error);
        return { users: {} };
    }
}

// Write data to JSON file
function writeData(data) {
    ensureStorageFile();
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing virtual portfolio storage:', error);
        throw error;
    }
}

// Get user's virtual portfolio data
function getUserPortfolio(username) {
    const data = readData();
    if (!data.users[username]) {
        data.users[username] = {
            virtual_balance: 100000.00,
            transactions: []
        };
        writeData(data);
    }
    return data.users[username];
}

// Update user's virtual balance
function updateVirtualBalance(username, newBalance) {
    const data = readData();
    if (!data.users[username]) {
        data.users[username] = {
            virtual_balance: 100000.00,
            transactions: []
        };
    }
    data.users[username].virtual_balance = newBalance;
    writeData(data);
    return newBalance;
}

// Add a transaction
function addTransaction(username, transaction) {
    const data = readData();
    if (!data.users[username]) {
        data.users[username] = {
            virtual_balance: 100000.00,
            transactions: []
        };
    }
    data.users[username].transactions.push(transaction);
    writeData(data);
}

// Get user's holdings (unsold transactions)
function getHoldings(username) {
    const portfolio = getUserPortfolio(username);
    return portfolio.transactions.filter(t => !t.is_sold || t.is_sold === '0' || t.is_sold === false);
}

// Update transaction (for selling)
function updateTransaction(username, timestamp, updates) {
    const data = readData();
    if (!data.users[username]) {
        return false;
    }
    
    const transaction = data.users[username].transactions.find(
        t => t.timestamp === timestamp && t.email === username
    );
    
    if (transaction) {
        // Apply updates to the transaction object
        Object.keys(updates).forEach(key => {
            transaction[key] = updates[key];
        });
        writeData(data);
        return true;
    }
    
    return false;
}

module.exports = {
    getUserPortfolio,
    updateVirtualBalance,
    addTransaction,
    getHoldings,
    updateTransaction
};

