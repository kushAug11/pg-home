const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const mongoose = require('mongoose');

// Backup Directory
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a full database backup (JSON export + ZIP)
 * @returns {Promise<string>} Path to the created ZIP file
 */
const createBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDir = path.join(BACKUP_DIR, `backup-${timestamp}`);
    const zipPath = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    try {
        // 1. Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();

        // 2. Export each collection to JSON
        for (const collection of collections) {
            const name = collection.name;
            const data = await mongoose.connection.db.collection(name).find({}).toArray();
            fs.writeFileSync(path.join(tempDir, `${name}.json`), JSON.stringify(data, null, 2));
        }

        // 3. Zip the directory
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(tempDir, false);
            archive.finalize();
        });

        // 4. Cleanup Temp Dir
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`✅ Backup created at: ${zipPath}`);
        return zipPath;

    } catch (error) {
        console.error("Backup Failed:", error);
        // Cleanup on error
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        throw error;
    }
};

/**
 * List available backups
 */
const listBackups = () => {
    return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.zip'))
        .map(file => {
            const stats = fs.statSync(path.join(BACKUP_DIR, file));
            return {
                filename: file,
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                created: stats.birthtime
            };
        })
        .sort((a, b) => b.created - a.created);
};

module.exports = { createBackup, listBackups, BACKUP_DIR };
