-- IER Academy Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enrollment status enum
CREATE TYPE enrollment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- Create payment status enum  
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- Create email status enum
CREATE TYPE email_status AS ENUM ('sent', 'failed', 'delivered', 'bounced');

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_slug VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    payment_ref VARCHAR(255),
    status enrollment_status DEFAULT 'pending',
    gdpr_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status payment_status DEFAULT 'pending',
    webhook_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email log table
CREATE TABLE email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider_message_id VARCHAR(255),
    status email_status DEFAULT 'sent'
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_enrollments_course_session ON enrollments(course_slug, session_id);
CREATE INDEX idx_enrollments_email ON enrollments(email);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX idx_email_log_enrollment ON email_log(enrollment_id);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE
    ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE
    ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
