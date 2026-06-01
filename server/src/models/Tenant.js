const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pg_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    rentAmount: {
        type: Number,
        required: true,
        min: [0, 'Rent amount cannot be negative']
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    idProofFrontPath: {
        type: String,
        required: false
    },
    idProofBackPath: {
        type: String,
        required: false
    },
    contact_number: {
        type: String
    },
    // Compliance Fields
    guardian_name: String,
    guardian_phone: String,
    permanent_address: String,
    id_proof_type: {
        type: String,
        enum: ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Other']
    },
    id_proof_number: String,
    blood_group: String,
    // End Compliance Fields
    preferences: {
        sleepSchedule: {
            type: String,
            enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'],
            default: 'FLEXIBLE'
        },
        diet: {
            type: String,
            enum: ['VEG', 'NON_VEG', 'EGGITARIAN', 'ANY'],
            default: 'ANY'
        },
        profession: {
            type: String,
            enum: ['STUDENT', 'PROFESSIONAL', 'OTHER'],
            default: 'OTHER'
        },
        cleanliness: {
            type: Number,
            default: 3,
            min: 1,
            max: 5
        },
        noiseTolerance: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM'
        }
    },
    moveInDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_notice', 'exited'],
        default: 'active'
    },
    exit_request: {
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED']

        },
        reason: String,
        requested_date: Date,
        request_date: Date,
        admin_comment: String
    },
    exit_date: Date,
});

tenantSchema.index({ pg_id: 1 });
tenantSchema.index({ pg_id: 1, status: 1 });
tenantSchema.index({ user_id: 1 }, { unique: true });

module.exports = mongoose.model('Tenant', tenantSchema);
