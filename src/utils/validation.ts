import { z } from 'zod';
import { UserRole } from '../types/auth';

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/\d/, 'Must contain at least one number');

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
    phone: phoneSchema,
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name too short').max(100, 'Product name too long'),
  description: z.string().min(10, 'Description too short').max(1000, 'Description too long'),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  minOrderQuantity: z.number().int().positive('Minimum order quantity must be at least 1'),
  maxOrderQuantity: z.number().int().positive().optional(),
  categoryId: z.string().uuid('Invalid category'),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
});

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  line1: z.string().min(5, 'Address line 1 too short'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type OTPFormValues = z.infer<typeof otpSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type AddressFormValues = z.infer<typeof addressSchema>;
