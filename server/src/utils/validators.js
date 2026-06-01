const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    role: z.enum(['owner', 'tenant'], { required_error: 'Role is required (owner or tenant)' })
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty')
  })
});

const createPaymentOrderSchema = z.object({
  body: z.object({
    type: z.enum(['SUBSCRIPTION', 'RENT'], { required_error: 'Payment type is required' }),
    planType: z.string().optional().nullable(),
    tenantId: z.string().optional().nullable(),
    amount: z.number().positive('Amount must be positive').optional().nullable()
  })
});

const roomSchema = z.object({
  body: z.object({
    roomNumber: z.string({ required_error: 'Room number is required' }).min(1),
    type: z.enum(['Single', 'Double', 'Triple', 'Dorm'], { required_error: 'Room type is required' }),
    rent: z.number().min(0, 'Rent cannot be negative'),
    capacity: z.number().min(1, 'Capacity must be at least 1')
  })
});

const expenseSchema = z.object({
  body: z.object({
    amount: z.number().min(0, 'Amount must be positive'),
    category: z.enum(['Electricity', 'Water', 'Maintenance', 'Staff Salary', 'Rent/Lease', 'Internet', 'Food/Groceries', 'Other']),
    description: z.string().optional()
  })
});

const noticeSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), z.enum(['GENERAL', 'URGENT', 'MAINTENANCE', 'INFO'])).optional()
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  createPaymentOrderSchema,
  roomSchema,
  expenseSchema,
  noticeSchema
};
