import { z } from 'zod';

// Enrollment validation schema
export const enrollmentSchema = z.object({
  courseSlug: z.string().min(1, 'Course slug is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, 'GDPR consent is required'),
  marketingConsent: z.boolean().optional().default(false),
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});
