const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

async function setupDatabase() {
    try {
        // Connect without specifying a database to be able to create one
        const connection = await mysql.createConnection(dbConfig);

        // Create the database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('Database created or already exists.');

        // Close the initial connection and reconnect to the new database
        await connection.end();

        const dbWithDb = { ...dbConfig, database: process.env.DB_NAME };
        const connectionWithDb = await mysql.createConnection(dbWithDb);

        // Create the users table if it doesn't exist
        await connectionWithDb.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Users table created or already exists.');
        await connectionWithDb.end();
        return { success: true, message: 'Database and table setup complete.' };
    } catch (error) {
        console.error('Error setting up database:', error);
        return { success: false, message: 'Error setting up database.', error: error.message };
    }
}


function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/api/test', (req, res) => {
        res.json({ message: 'Backend is running!' });
    });

    app.get('/api/setup-database', async (req, res) => {
        const result = await setupDatabase();
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    });

    return app;
}

module.exports = { createApp };
