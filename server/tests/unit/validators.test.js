const {
    registerSchema,
    loginSchema,
    roomSchema,
    expenseSchema,
    noticeSchema,
    createPaymentOrderSchema
} = require('../../src/utils/validators');

// ─────────────────────────────────────────────
// registerSchema
// ─────────────────────────────────────────────
describe('Unit: registerSchema', () => {
    const valid = { body: { name: 'John Doe', email: 'john@test.com', password: 'pass123', role: 'owner' } };

    it('passes with valid owner data', () => {
        const result = registerSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('passes with valid tenant role', () => {
        const result = registerSchema.safeParse({ body: { ...valid.body, role: 'tenant' } });
        expect(result.success).toBe(true);
    });

    it('fails when name is missing', () => {
        const { name, ...rest } = valid.body;
        const result = registerSchema.safeParse({ body: rest });
        expect(result.success).toBe(false);
    });

    it('fails when name is shorter than 2 characters', () => {
        const result = registerSchema.safeParse({ body: { ...valid.body, name: 'A' } });
        expect(result.success).toBe(false);
    });

    it('fails with invalid email format', () => {
        const result = registerSchema.safeParse({ body: { ...valid.body, email: 'not-an-email' } });
        expect(result.success).toBe(false);
    });

    it('fails when email is missing', () => {
        const { email, ...rest } = valid.body;
        const result = registerSchema.safeParse({ body: rest });
        expect(result.success).toBe(false);
    });

    it('fails when password is shorter than 6 characters', () => {
        const result = registerSchema.safeParse({ body: { ...valid.body, password: 'abc' } });
        expect(result.success).toBe(false);
    });

    it('fails when password is missing', () => {
        const { password, ...rest } = valid.body;
        const result = registerSchema.safeParse({ body: rest });
        expect(result.success).toBe(false);
    });

    it('fails with invalid role', () => {
        const result = registerSchema.safeParse({ body: { ...valid.body, role: 'admin' } });
        expect(result.success).toBe(false);
    });

    it('fails when role is missing', () => {
        const { role, ...rest } = valid.body;
        const result = registerSchema.safeParse({ body: rest });
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// loginSchema
// ─────────────────────────────────────────────
describe('Unit: loginSchema', () => {
    const valid = { body: { email: 'john@test.com', password: 'anypassword' } };

    it('passes with valid email and password', () => {
        const result = loginSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('fails when email is missing', () => {
        const result = loginSchema.safeParse({ body: { password: 'anypassword' } });
        expect(result.success).toBe(false);
    });

    it('fails when password is missing', () => {
        const result = loginSchema.safeParse({ body: { email: 'john@test.com' } });
        expect(result.success).toBe(false);
    });

    it('fails with invalid email format', () => {
        const result = loginSchema.safeParse({ body: { email: 'bad-email', password: 'anypassword' } });
        expect(result.success).toBe(false);
    });

    it('fails when password is empty string', () => {
        const result = loginSchema.safeParse({ body: { email: 'john@test.com', password: '' } });
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// roomSchema
// ─────────────────────────────────────────────
describe('Unit: roomSchema', () => {
    const valid = { body: { roomNumber: '101', type: 'Single', rent: 5000, capacity: 1 } };

    it('passes with valid room data', () => {
        const result = roomSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('passes for each valid room type', () => {
        ['Single', 'Double', 'Triple', 'Dorm'].forEach((type) => {
            const result = roomSchema.safeParse({ body: { ...valid.body, type } });
            expect(result.success).toBe(true);
        });
    });

    it('fails with invalid room type', () => {
        const result = roomSchema.safeParse({ body: { ...valid.body, type: 'Suite' } });
        expect(result.success).toBe(false);
    });

    it('fails when rent is negative', () => {
        const result = roomSchema.safeParse({ body: { ...valid.body, rent: -100 } });
        expect(result.success).toBe(false);
    });

    it('passes when rent is zero', () => {
        const result = roomSchema.safeParse({ body: { ...valid.body, rent: 0 } });
        expect(result.success).toBe(true);
    });

    it('fails when capacity is less than 1', () => {
        const result = roomSchema.safeParse({ body: { ...valid.body, capacity: 0 } });
        expect(result.success).toBe(false);
    });

    it('fails when roomNumber is missing', () => {
        const { roomNumber, ...rest } = valid.body;
        const result = roomSchema.safeParse({ body: rest });
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// expenseSchema
// ─────────────────────────────────────────────
describe('Unit: expenseSchema', () => {
    const valid = { body: { amount: 200, category: 'Electricity' } };

    it('passes with valid expense data', () => {
        const result = expenseSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('passes for each valid category', () => {
        const categories = [
            'Electricity', 'Water', 'Maintenance', 'Staff Salary',
            'Rent/Lease', 'Internet', 'Food/Groceries', 'Other'
        ];
        categories.forEach((category) => {
            const result = expenseSchema.safeParse({ body: { ...valid.body, category } });
            expect(result.success).toBe(true);
        });
    });

    it('fails with invalid category', () => {
        const result = expenseSchema.safeParse({ body: { ...valid.body, category: 'Entertainment' } });
        expect(result.success).toBe(false);
    });

    it('fails when amount is negative', () => {
        const result = expenseSchema.safeParse({ body: { ...valid.body, amount: -50 } });
        expect(result.success).toBe(false);
    });

    it('passes when amount is zero', () => {
        const result = expenseSchema.safeParse({ body: { ...valid.body, amount: 0 } });
        expect(result.success).toBe(true);
    });

    it('passes when optional description is provided', () => {
        const result = expenseSchema.safeParse({ body: { ...valid.body, description: 'Monthly bill' } });
        expect(result.success).toBe(true);
    });

    it('passes when optional description is omitted', () => {
        const result = expenseSchema.safeParse(valid);
        expect(result.success).toBe(true);
        expect(result.data.body.description).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// noticeSchema
// ─────────────────────────────────────────────
describe('Unit: noticeSchema', () => {
    const valid = { body: { title: 'Important Notice', message: 'Please read this carefully.' } };

    it('passes with valid notice data (no type)', () => {
        const result = noticeSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('passes with a valid uppercase type', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, type: 'URGENT' } });
        expect(result.success).toBe(true);
        expect(result.data.body.type).toBe('URGENT');
    });

    it('normalizes lowercase type to uppercase', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, type: 'general' } });
        expect(result.success).toBe(true);
        expect(result.data.body.type).toBe('GENERAL');
    });

    it('normalizes mixed-case type to uppercase', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, type: 'Maintenance' } });
        expect(result.success).toBe(true);
        expect(result.data.body.type).toBe('MAINTENANCE');
    });

    it('fails when title is empty', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, title: '' } });
        expect(result.success).toBe(false);
    });

    it('fails when message is empty', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, message: '' } });
        expect(result.success).toBe(false);
    });

    it('fails with invalid type value', () => {
        const result = noticeSchema.safeParse({ body: { ...valid.body, type: 'ANNOUNCEMENT' } });
        expect(result.success).toBe(false);
    });

    it('passes when title is missing but type is optional', () => {
        // title is required, so this must fail
        const result = noticeSchema.safeParse({ body: { message: 'Hello', type: 'INFO' } });
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// createPaymentOrderSchema
// ─────────────────────────────────────────────
describe('Unit: createPaymentOrderSchema', () => {
    it('passes with valid SUBSCRIPTION type', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'SUBSCRIPTION', planType: 'BASIC' }
        });
        expect(result.success).toBe(true);
    });

    it('passes with valid RENT type', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'RENT', tenantId: '64abc123', amount: 5000 }
        });
        expect(result.success).toBe(true);
    });

    it('passes with RENT type and null optional fields', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'RENT', tenantId: null, amount: null }
        });
        expect(result.success).toBe(true);
    });

    it('fails with invalid payment type', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'CASH' }
        });
        expect(result.success).toBe(false);
    });

    it('fails when type is missing', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { planType: 'BASIC' }
        });
        expect(result.success).toBe(false);
    });

    it('fails when amount is a negative number', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'RENT', amount: -100 }
        });
        expect(result.success).toBe(false);
    });

    it('passes when all optional fields are omitted', () => {
        const result = createPaymentOrderSchema.safeParse({
            body: { type: 'SUBSCRIPTION' }
        });
        expect(result.success).toBe(true);
    });
});
