-- =============================================
-- SAMPLE DATA FOR CMS
-- This script populates the database with sample content
-- =============================================

-- Clear existing data (except admin users)
TRUNCATE TABLE testimonials, faqs, partners, blog_posts, page_sections, courses, events, instructors, staff, venues RESTART IDENTITY CASCADE;

-- =============================================
-- SAMPLE INSTRUCTORS
-- =============================================
INSERT INTO instructors (name, title, bio, photo_url, email, specialties, is_published, sort_order) VALUES
('John Smith', 'Senior Cybersecurity Expert', 'With over 15 years of experience in cybersecurity, John has worked with Fortune 500 companies to secure their infrastructure. He holds CISSP and CEH certifications.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'john.smith@ieracademy.com', ARRAY['Cybersecurity', 'Ethical Hacking', 'Network Security'], true, 1),
('Sarah Johnson', 'Cloud Architecture Specialist', 'Sarah is a certified AWS Solutions Architect with 10+ years of experience in cloud computing. She has helped numerous organizations migrate to the cloud successfully.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'sarah.johnson@ieracademy.com', ARRAY['AWS', 'Azure', 'Cloud Architecture'], true, 2),
('Michael Chen', 'Full Stack Developer & Instructor', 'Michael has been developing web applications for over 12 years. He specializes in modern JavaScript frameworks and has taught thousands of students worldwide.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'michael.chen@ieracademy.com', ARRAY['JavaScript', 'React', 'Node.js', 'Python'], true, 3);

-- =============================================
-- SAMPLE STAFF
-- =============================================
INSERT INTO staff (name, position, bio, photo_url, email, department, is_published, sort_order) VALUES
('Emma Williams', 'Director of Education', 'Emma oversees all educational programs at IER Academy, ensuring the highest quality of instruction and student success.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'emma.williams@ieracademy.com', 'Education', true, 1),
('David Brown', 'Student Support Manager', 'David leads our student support team, ensuring every student has a positive learning experience from enrollment to graduation.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'david.brown@ieracademy.com', 'Student Services', true, 2);

-- =============================================
-- SAMPLE VENUES
-- =============================================
INSERT INTO venues (name, address, city, country, capacity, facilities, is_published) VALUES
('IER Academy Main Campus', '123 Tech Street', 'Prishtina', 'Kosovo', 100, ARRAY['Computer Lab', 'WiFi', 'Parking', 'Coffee Shop'], true),
('IER Academy Innovation Hub', '456 Innovation Avenue', 'Prishtina', 'Kosovo', 50, ARRAY['Modern Classrooms', 'Video Conferencing', 'WiFi', 'Study Rooms'], true);

-- =============================================
-- SAMPLE COURSES
-- =============================================
INSERT INTO courses (slug, title, description, short_description, price, currency, duration, level, instructor_id, thumbnail_url, is_published, is_featured, sort_order) VALUES
('cybersecurity-fundamentals', 'Cybersecurity Fundamentals', 'Learn the essential concepts of cybersecurity including threat detection, risk management, and security best practices. This comprehensive course covers network security, cryptography, and incident response.', 'Master the fundamentals of cybersecurity and protect digital assets from modern threats.', 599.00, 'EUR', '8 weeks', 'Beginner', (SELECT id FROM instructors WHERE name = 'John Smith'), 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800', true, true, 1),
('aws-cloud-architect', 'AWS Cloud Architecture', 'Become an AWS Certified Solutions Architect with this hands-on course. Learn to design scalable, highly available systems on AWS cloud platform.', 'Design and deploy scalable cloud solutions on Amazon Web Services.', 799.00, 'EUR', '10 weeks', 'Intermediate', (SELECT id FROM instructors WHERE name = 'Sarah Johnson'), 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', true, true, 2),
('full-stack-web-development', 'Full Stack Web Development', 'Build modern web applications from scratch using React, Node.js, and PostgreSQL. Learn frontend and backend development with hands-on projects.', 'Become a full stack developer with modern JavaScript technologies.', 899.00, 'EUR', '12 weeks', 'Beginner', (SELECT id FROM instructors WHERE name = 'Michael Chen'), 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', true, true, 3),
('python-data-science', 'Python for Data Science', 'Master Python programming for data analysis, visualization, and machine learning. Work with pandas, NumPy, and scikit-learn.', 'Learn Python and data science fundamentals for real-world applications.', 699.00, 'EUR', '10 weeks', 'Beginner', (SELECT id FROM instructors WHERE name = 'Michael Chen'), 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', true, false, 4);

-- =============================================
-- SAMPLE COURSE MODULES
-- =============================================
INSERT INTO course_modules (course_id, title, objectives, outline, sort_order, is_published) VALUES
-- Cybersecurity Fundamentals Modules
((SELECT id FROM courses WHERE slug = 'cybersecurity-fundamentals'), 'Introduction to Cybersecurity', 
'By the end of this module, students will be able to:
• Understand the fundamental concepts of cybersecurity
• Identify common cyber threats and attack vectors
• Explain the importance of cybersecurity in modern organizations
• Recognize the role of cybersecurity professionals',
'Module Contents:
• What is Cybersecurity?
• Types of Cyber Threats
• Attack Vectors and Methods
• Cybersecurity Frameworks
• Risk Assessment Basics
• Introduction to Security Policies', 1, true),

((SELECT id FROM courses WHERE slug = 'cybersecurity-fundamentals'), 'Network Security Fundamentals', 
'By the end of this module, students will be able to:
• Configure basic network security measures
• Understand firewall concepts and implementation
• Identify network vulnerabilities
• Implement secure network protocols',
'Module Contents:
• Network Security Architecture
• Firewall Configuration
• Intrusion Detection Systems
• VPN Technologies
• Network Monitoring
• Wireless Security', 2, true),

((SELECT id FROM courses WHERE slug = 'cybersecurity-fundamentals'), 'Cryptography and Data Protection', 
'By the end of this module, students will be able to:
• Understand cryptographic principles
• Implement data encryption techniques
• Manage digital certificates
• Secure data transmission',
'Module Contents:
• Symmetric and Asymmetric Encryption
• Hash Functions and Digital Signatures
• Public Key Infrastructure (PKI)
• SSL/TLS Implementation
• Data Loss Prevention
• Secure Communication Protocols', 3, true),

-- AWS Cloud Architecture Modules
((SELECT id FROM courses WHERE slug = 'aws-cloud-architect'), 'AWS Fundamentals', 
'By the end of this module, students will be able to:
• Understand AWS core services and architecture
• Navigate the AWS Management Console
• Implement basic AWS security best practices
• Understand AWS pricing models',
'Module Contents:
• AWS Global Infrastructure
• AWS Management Console
• Identity and Access Management (IAM)
• AWS Security Best Practices
• AWS Pricing and Billing
• AWS Support Plans', 1, true),

((SELECT id FROM courses WHERE slug = 'aws-cloud-architect'), 'Compute Services', 
'By the end of this module, students will be able to:
• Deploy and manage EC2 instances
• Configure Auto Scaling groups
• Implement load balancing
• Use AWS Lambda for serverless computing',
'Module Contents:
• Amazon EC2 Fundamentals
• Instance Types and Pricing
• Auto Scaling Groups
• Elastic Load Balancing
• AWS Lambda Functions
• Container Services (ECS/EKS)', 2, true),

((SELECT id FROM courses WHERE slug = 'aws-cloud-architect'), 'Storage and Database Services', 
'By the end of this module, students will be able to:
• Implement scalable storage solutions
• Configure database services
• Design data backup and recovery strategies
• Optimize storage performance',
'Module Contents:
• Amazon S3 Storage
• Amazon EBS Volumes
• Amazon RDS Databases
• Amazon DynamoDB
• Data Backup Strategies
• Storage Optimization', 3, true),

-- Full Stack Web Development Modules
((SELECT id FROM courses WHERE slug = 'full-stack-web-development'), 'Frontend Development with React', 
'By the end of this module, students will be able to:
• Build interactive user interfaces with React
• Manage component state and props
• Implement routing and navigation
• Use modern JavaScript features',
'Module Contents:
• React Fundamentals
• Components and JSX
• State Management
• React Router
• Hooks and Functional Components
• Styling with CSS and Styled Components', 1, true),

((SELECT id FROM courses WHERE slug = 'full-stack-web-development'), 'Backend Development with Node.js', 
'By the end of this module, students will be able to:
• Create RESTful APIs with Express.js
• Implement authentication and authorization
• Connect to databases
• Handle errors and validation',
'Module Contents:
• Node.js Fundamentals
• Express.js Framework
• RESTful API Design
• Authentication and JWT
• Database Integration
• Error Handling and Validation', 2, true),

((SELECT id FROM courses WHERE slug = 'full-stack-web-development'), 'Database Design and Management', 
'By the end of this module, students will be able to:
• Design relational database schemas
• Write efficient SQL queries
• Implement database migrations
• Optimize database performance',
'Module Contents:
• Database Design Principles
• SQL Fundamentals
• PostgreSQL Features
• Database Migrations
• Query Optimization
• Database Security', 3, true);

-- =============================================
-- SAMPLE SESSIONS
-- =============================================
INSERT INTO sessions (course_id, title, description, start_date, end_date, mode, venue_id, capacity, enrolled_count, is_published) VALUES
((SELECT id FROM courses WHERE slug = 'cybersecurity-fundamentals'), 'Cybersecurity Spring 2025', 'Spring semester intensive course', '2025-03-15', '2025-05-10', 'hybrid', (SELECT id FROM venues WHERE name = 'IER Academy Main Campus'), 30, 12, true),
((SELECT id FROM courses WHERE slug = 'cybersecurity-fundamentals'), 'Cybersecurity Summer 2025', 'Summer intensive program', '2025-06-01', '2025-07-27', 'online', NULL, 50, 5, true),
((SELECT id FROM courses WHERE slug = 'aws-cloud-architect'), 'AWS Architecture March 2025', 'Comprehensive AWS training', '2025-03-20', '2025-05-29', 'hybrid', (SELECT id FROM venues WHERE name = 'IER Academy Innovation Hub'), 25, 8, true),
((SELECT id FROM courses WHERE slug = 'full-stack-web-development'), 'Full Stack Bootcamp April 2025', 'Intensive bootcamp program', '2025-04-01', '2025-06-24', 'in-person', (SELECT id FROM venues WHERE name = 'IER Academy Main Campus'), 20, 15, true),
((SELECT id FROM courses WHERE slug = 'python-data-science'), 'Data Science May 2025', 'Python data science course', '2025-05-05', '2025-07-14', 'online', NULL, 40, 10, true);

-- =============================================
-- SAMPLE EVENTS (matching existing events table structure)
-- =============================================
INSERT INTO events (slug, title, description, event_date, event_end_date, location, capacity, current_registrations, price, currency, event_type, is_published, tags) VALUES
('cyber-race-2025', 'Cyber Race 2025', 'Join the ultimate cybersecurity competition! Test your skills in ethical hacking, cryptography, and network security. Prizes for top performers! This annual event brings together cybersecurity enthusiasts and professionals to compete in various challenges.', '2025-05-15 10:00:00+00', '2025-05-15 18:00:00+00', 'IER Academy Main Campus', 100, 45, 0, 'EUR', 'workshop', true, ARRAY['cybersecurity', 'competition', 'hacking']),
('tech-career-fair-2025', 'Tech Career Fair 2025', 'Meet leading tech companies looking for talented professionals. Network with industry leaders and explore career opportunities in technology. Connect with recruiters, attend workshops, and discover your next career move in the tech industry.', '2025-04-20 09:00:00+00', '2025-04-20 17:00:00+00', 'IER Academy Innovation Hub', 200, 78, 0, 'EUR', 'networking', true, ARRAY['career', 'networking', 'jobs']);

-- =============================================
-- SAMPLE TESTIMONIALS
-- =============================================
INSERT INTO testimonials (name, position, company, content, photo_url, rating, is_published, sort_order) VALUES
('Alex Thompson', 'Security Analyst', 'TechCorp International', 'The Cybersecurity Fundamentals course completely changed my career. The instructors are top-notch and the hands-on labs were invaluable. I got a job offer before even finishing the course!', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', 5, true, 1),
('Maria Garcia', 'Cloud Engineer', 'CloudSys Solutions', 'Best investment I have made in my career! The AWS course was comprehensive and practical. Sarah is an amazing instructor who really cares about student success.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400', 5, true, 2),
('James Wilson', 'Full Stack Developer', 'StartupHub', 'I went from zero coding knowledge to building full-stack applications in just 3 months. The curriculum is well-structured and the support is outstanding.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', 5, true, 3),
('Lisa Anderson', 'Data Scientist', 'Analytics Pro', 'The Python Data Science course exceeded my expectations. Great content, excellent projects, and a supportive learning community.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400', 5, true, 4);

-- =============================================
-- SAMPLE FAQs
-- =============================================
INSERT INTO faqs (question, answer, category, is_published, sort_order) VALUES
('What are the payment options?', 'We accept bank transfers and installment plans for courses. Payment must be completed within 3 days of enrollment to secure your spot.', 'Payment', true, 1),
('Do I need prior experience?', 'It depends on the course. We offer courses for all levels - from complete beginners to advanced professionals. Check the course level indicator on each course page.', 'General', true, 2),
('Are the courses certified?', 'Yes! Upon successful completion, you will receive a certificate of completion from IER Academy. Some courses also prepare you for industry certifications.', 'Courses', true, 3),
('Can I study online?', 'Absolutely! We offer online, in-person, and hybrid learning options. You can choose the format that works best for your schedule.', 'General', true, 4),
('What if I miss a class?', 'All sessions are recorded and available for 6 months. You can catch up at your own pace. We also provide supplementary materials and support.', 'Courses', true, 5),
('How do I enroll?', 'Simply browse our courses, select a session that fits your schedule, fill out the enrollment form, and complete the payment. You will receive confirmation via email.', 'Enrollment', true, 6);

-- =============================================
-- SAMPLE PARTNERS
-- =============================================
INSERT INTO partners (name, logo_url, website_url, description, is_published, sort_order) VALUES
('TechCorp International', 'https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=TechCorp', 'https://techcorp.example.com', 'Leading technology solutions provider', true, 1),
('CloudSys Solutions', 'https://via.placeholder.com/200x80/059669/FFFFFF?text=CloudSys', 'https://cloudsys.example.com', 'Cloud infrastructure experts', true, 2),
('DataAnalytics Pro', 'https://via.placeholder.com/200x80/DC2626/FFFFFF?text=DataPro', 'https://datapro.example.com', 'Data science and analytics company', true, 3),
('CyberDefense Inc', 'https://via.placeholder.com/200x80/7C3AED/FFFFFF?text=CyberDefense', 'https://cyberdefense.example.com', 'Cybersecurity solutions provider', true, 4);

-- =============================================
-- SAMPLE BLOG POSTS
-- =============================================
INSERT INTO blog_posts (slug, title, excerpt, content, author_id, featured_image_url, tags, is_published, is_featured, published_at) VALUES
('5-cybersecurity-tips-2025', '5 Essential Cybersecurity Tips for 2025', 'Stay safe online with these crucial cybersecurity practices that every professional should know.', 'In today''s digital world, cybersecurity is more important than ever. Here are 5 essential tips to keep your data safe:

1. **Use Strong, Unique Passwords**: Never reuse passwords across multiple accounts. Use a password manager to generate and store complex passwords.

2. **Enable Two-Factor Authentication**: Add an extra layer of security to your accounts by enabling 2FA wherever possible.

3. **Keep Software Updated**: Regular updates patch security vulnerabilities. Enable automatic updates for your operating system and applications.

4. **Be Wary of Phishing**: Always verify the sender before clicking links or downloading attachments in emails.

5. **Use a VPN**: Protect your internet connection, especially on public WiFi, with a reliable VPN service.

Stay safe and keep learning!', (SELECT id FROM staff WHERE name = 'Emma Williams'), 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', ARRAY['Cybersecurity', 'Tips', 'Best Practices'], true, true, NOW()),

('cloud-computing-trends-2025', 'Cloud Computing Trends to Watch in 2025', 'Discover the latest trends shaping the future of cloud computing and how they impact businesses.', 'Cloud computing continues to evolve rapidly. Here are the key trends for 2025:

**1. Multi-Cloud Strategies**
Organizations are increasingly adopting multi-cloud approaches to avoid vendor lock-in and optimize costs.

**2. Edge Computing**
Processing data closer to its source is becoming crucial for IoT and real-time applications.

**3. Serverless Architecture**
Serverless computing is gaining traction for its scalability and cost-effectiveness.

**4. AI and ML Integration**
Cloud providers are embedding AI and machine learning capabilities directly into their platforms.

**5. Enhanced Security**
Zero-trust security models are becoming standard in cloud environments.

Stay ahead of the curve by understanding these trends!', (SELECT id FROM staff WHERE name = 'David Brown'), 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', ARRAY['Cloud Computing', 'AWS', 'Trends'], true, true, NOW() - INTERVAL '2 days'),

('full-stack-developer-roadmap', 'Your Complete Full Stack Developer Roadmap', 'A comprehensive guide to becoming a successful full stack developer in 2025.', 'Want to become a full stack developer? Here''s your roadmap:

**Frontend Development**
- HTML, CSS, JavaScript fundamentals
- Modern frameworks: React, Vue, or Angular
- Responsive design and accessibility

**Backend Development**
- Server-side languages: Node.js, Python, or Java
- RESTful API design
- Database management (SQL and NoSQL)

**DevOps Basics**
- Version control with Git
- CI/CD pipelines
- Docker and containerization

**Soft Skills**
- Problem-solving
- Communication
- Continuous learning

Start your journey with our Full Stack Web Development course!', (SELECT id FROM staff WHERE name = 'Emma Williams'), 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', ARRAY['Web Development', 'Career', 'Learning Path'], true, false, NOW() - INTERVAL '5 days');

-- =============================================
-- Update homepage sections in page_sections table
-- =============================================

-- Get the home page ID
DO $$
DECLARE
  home_page_id INTEGER;
BEGIN
  SELECT id INTO home_page_id FROM pages WHERE slug = 'home';
  
  -- Delete existing sections
  DELETE FROM page_sections WHERE page_id = home_page_id;
  
  -- Hero Section
  INSERT INTO page_sections (page_id, section_type, title, subtitle, content, data, sort_order, is_published) VALUES
  (home_page_id, 'hero', 'Transform Your Career with Professional IT Training', 'Industry-Leading Courses in Cybersecurity, Cloud Computing & Software Development', 'Join thousands of professionals who have advanced their careers with IER Academy. Get certified, get hired, get ahead.', 
  '{"cta_text": "Explore Courses", "cta_link": "/courses", "secondary_cta_text": "View Events", "secondary_cta_link": "/events"}', 1, true);
  
  -- Why Choose Us Section
  INSERT INTO page_sections (page_id, section_type, title, subtitle, content, data, sort_order, is_published) VALUES
  (home_page_id, 'features', 'Why Choose IER Academy?', 'The Best Place to Learn IT Skills', NULL, 
  '{"features": [
    {"icon": "Users", "title": "Expert Instructors", "description": "Learn from industry professionals with years of real-world experience"},
    {"icon": "Award", "title": "Industry Certifications", "description": "Prepare for and earn recognized professional certifications"},
    {"icon": "BookOpen", "title": "Hands-On Learning", "description": "Practice with real projects and scenarios from day one"},
    {"icon": "Trophy", "title": "Career Support", "description": "Get job placement assistance and career guidance"}
  ]}', 2, true);
  
  -- Stats Section
  INSERT INTO page_sections (page_id, section_type, title, content, data, sort_order, is_published) VALUES
  (home_page_id, 'stats', 'Our Impact in Numbers', NULL,
  '{"stats": [
    {"value": "5000+", "label": "Students Trained"},
    {"value": "50+", "label": "Expert Instructors"},
    {"value": "95%", "label": "Job Placement Rate"},
    {"value": "40+", "label": "Industry Partners"}
  ]}', 3, true);
  
END $$;

COMMIT;

