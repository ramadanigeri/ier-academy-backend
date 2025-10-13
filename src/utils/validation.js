import { z } from "zod";

// Enrollment validation schema
export const enrollmentSchema = z.object({
  courseSlug: z.string().min(1, "Course slug is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  idCard: z.string().min(1, "ID card number is required"),
  address: z.string().min(1, "Address is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent is required"),
  marketingConsent: z.boolean().optional().default(false),
});

// Event registration validation schema
export const eventRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

// Event registration by title validation schema (for frontend modal)
export const eventRegistrationByTitleSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  school: z.string().min(1, "School name is required"),
  eventTitle: z.string().min(1, "Event title is required"),
  registeredAt: z.string().optional(),
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});
