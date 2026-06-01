
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { checkPendingActivations } = require('../../src/services/nudge.service');
const User = require('../../src/models/User');
const PG = require('../../src/models/PG');
const OnboardingAnalytics = require('../../src/models/OnboardingAnalytics');

// Mock dependencies
jest.mock('../../src/services/communication.service', () => ({
    sendOnboardingCommunication: jest.fn().mockResolvedValue({ email: true })
}));

describe('🤖 Nudge Service Unit Tests', () => {
    let mongod;
    let pgId;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());

        const pg = await PG.create({
            name: "Nudge PG",
            owner_id: new mongoose.Types.ObjectId(),
            address: "Test Street",
            city: "Test City"
        });
        pgId = pg._id;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongod.stop();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await OnboardingAnalytics.deleteMany({});
        jest.clearAllMocks();
    });

    test('Should nudge user created > 24h ago with no prior nudge', async () => {
        const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        await User.create({
            name: "Needs Nudge",
            email: "nudge@test.com",
            password: "pass",
            accountStatus: 'PENDING_ACTIVATION',
            createdAt: oldDate,
            pg_id: pgId
        });

        await checkPendingActivations();

        const user = await User.findOne({ email: "nudge@test.com" });
        expect(user.lastNudgeSentAt).toBeDefined();
        // Check if analytics logged
        const log = await OnboardingAnalytics.findOne({ 'meta.type': 'NUDGE_24H' });
        expect(log).toBeTruthy();
    });

    test('Should NOT nudge user created < 24h ago', async () => {
        const recentDate = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
        await User.create({
            name: "Recent User",
            email: "recent@test.com",
            password: "pass",
            accountStatus: 'PENDING_ACTIVATION',
            createdAt: recentDate,
            pg_id: pgId
        });

        await checkPendingActivations();

        const user = await User.findOne({ email: "recent@test.com" });
        expect(user.lastNudgeSentAt).toBeUndefined();
    });

    test('Should NOT nudge user already nudged < 24h ago', async () => {
        const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
        const recentNudge = new Date(Date.now() - 2 * 60 * 60 * 1000); // Nudged 2 hours ago

        await User.create({
            name: "Spam Check",
            email: "spam@test.com",
            password: "pass",
            accountStatus: 'PENDING_ACTIVATION',
            createdAt: oldDate,
            lastNudgeSentAt: recentNudge,
            pg_id: pgId
        });

        await checkPendingActivations();

        const user = await User.findOne({ email: "spam@test.com" });
        // Timestamp should NOT change
        expect(user.lastNudgeSentAt.getTime()).toBe(recentNudge.getTime());
    });

    test('Should nudge user nudged > 24h ago (Retry logic)', async () => {
        const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 hours ago
        const oldNudge = new Date(Date.now() - 25 * 60 * 60 * 1000); // Nudged 25 hours ago

        await User.create({
            name: "Retry Nudge",
            email: "retry@test.com",
            password: "pass",
            accountStatus: 'PENDING_ACTIVATION',
            createdAt: oldDate,
            lastNudgeSentAt: oldNudge,
            pg_id: pgId
        });

        await checkPendingActivations();

        const user = await User.findOne({ email: "retry@test.com" });
        expect(user.lastNudgeSentAt.getTime()).toBeGreaterThan(oldNudge.getTime());
    });
});
