#!/usr/bin/env node

/**
 * Watch backend Python files and auto-fetch OpenAPI schema
 * Runs in frontend to keep backend pure Python
 */

const chokidar = require('chokidar');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_PATH = path.resolve(__dirname, '../../backend/app');
const BACKEND_SCHEMA_PATH = path.resolve(__dirname, '../../backend/openapi.json');
const FRONTEND_SCHEMA_PATH = path.resolve(__dirname, '../openapi.json');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const DEBOUNCE_MS = 2000; // Wait 2 seconds after last change

console.log('👀 Backend Schema Watcher (from frontend)');
console.log(`📂 Watching: ${BACKEND_PATH}`);
console.log(`🌐 Backend URL: ${BACKEND_URL}`);
console.log('');

let timeoutId = null;

function fetchAndSaveSchema() {
    console.log('⏳ Fetching OpenAPI schema from backend...');

    http.get(`${BACKEND_URL}/api/v1/openapi.json`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const schema = JSON.parse(data);
                    const serialized = JSON.stringify(schema, null, 2) + '\n';
                    fs.writeFileSync(BACKEND_SCHEMA_PATH, serialized);
                    fs.writeFileSync(FRONTEND_SCHEMA_PATH, serialized);
                    console.log('✅ OpenAPI schema updated successfully!');
                    console.log(`📁 Backend schema: ${BACKEND_SCHEMA_PATH}`);
                    console.log(`📁 Frontend schema: ${FRONTEND_SCHEMA_PATH}`);
                    console.log('👀 Continuing to watch for backend changes...\n');
                } catch (error) {
                    console.error('❌ Error parsing schema JSON:', error.message);
                }
            } else {
                console.error(`❌ Failed to fetch schema. Status: ${res.statusCode}`);
            }
        });
    }).on('error', (error) => {
        console.error('❌ Error fetching schema:', error.message);
        console.error('💡 Make sure backend is running at', BACKEND_URL);
    });
}

// Watch Python files in backend
const watcher = chokidar.watch(
    [`${BACKEND_PATH}/**/*.py`],
    {
        ignored: [
            '**/node_modules/**',
            '**/__pycache__/**',
            '**/*.pyc',
            '**/venv/**',
            '**/.venv/**',
        ],
        persistent: true,
        ignoreInitial: true,
    }
);

watcher.on('change', (filePath) => {
    const relativePath = path.relative(path.resolve(__dirname, '../..'), filePath);
    console.log(`\n🔄 Backend file changed: ${relativePath}`);

    // Clear existing timeout
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    // Debounce: wait for changes to settle before fetching
    timeoutId = setTimeout(fetchAndSaveSchema, DEBOUNCE_MS);
});

watcher.on('ready', () => {
    console.log('✅ Watcher ready! Backend changes will auto-update schema.\n');

    // Fetch schema on startup (wait a bit for backend to be ready)
    setTimeout(() => {
        console.log('📥 Fetching initial schema...');
        fetchAndSaveSchema();
    }, 2000);
});

watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Stopping backend watcher...');
    watcher.close();
    process.exit(0);
});

