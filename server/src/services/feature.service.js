const fs = require('fs');
const path = require('path');

// Default Config Path
const CONFIG_PATH = path.join(__dirname, '../../config/features.json');

// In-Memory Cache
let featureCache = {};

// Load features on startup
if (fs.existsSync(CONFIG_PATH)) {
    try {
        featureCache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
        console.error("Failed to load feature flags:", e);
    }
} else {
    // Default Defaults
    featureCache = {
        features: {
            "beta_payments": { "enabled": false, "pg_ids": [] },
            "bulk_upload": { "enabled": true, "pg_ids": ["*"] },
            "maintenance_mode": { "enabled": false, "message": "System under maintenance" }
        }
    };
}

const FeatureService = {
    /**
     * Check if a feature is enabled for a specific PG
     * @param {string} featureName 
     * @param {string} pgId 
     * @returns {boolean}
     */
    isEnabled: (featureName, pgId) => {
        const feature = featureCache.features[featureName];
        if (!feature) return false; // Default to closed

        // Global Kill Switch
        if (!feature.enabled) return false;

        // Global Rollout
        if (feature.pg_ids.includes('*')) return true;

        // Specific PG Rollout
        if (pgId && feature.pg_ids.includes(pgId.toString())) return true;

        return false;
    },

    /**
     * Get Feature Configuration (Public)
     */
    getAllFeatures: () => featureCache.features,

    /**
     * Reload flags without restart
     */
    reload: () => {
        if (fs.existsSync(CONFIG_PATH)) {
            featureCache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            console.log("🔄 Feature Flags Reloaded");
        }
    }
};

module.exports = FeatureService;
