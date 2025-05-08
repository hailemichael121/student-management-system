-- Enable Row Level Security for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reminders ENABLE ROW LEVEL SECURITY;

-- Create profiles table (fixed)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  student_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create courses table (fixed)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (fixed)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create course materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Add RLS policies for courses
CREATE POLICY "Teachers can manage their own courses"
ON courses FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled courses"
ON courses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = courses.id 
    AND enrollments.student_id = auth.uid()
  )
);

-- Add RLS policies for enrollments
CREATE POLICY "Students can view their enrollments"
ON enrollments FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses"
ON enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can request enrollment"
ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Add RLS policies for course materials
CREATE POLICY "Teachers can manage course materials"
ON course_materials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_materials.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view course materials"
ON course_materials FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    JOIN courses ON courses.id = enrollments.course_id
    WHERE enrollments.course_id = course_materials.course_id
    AND enrollments.student_id = auth.uid()
  )
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_assignments_modtime
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_discussions_modtime
BEFORE UPDATE ON discussions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_discussion_replies_modtime
BEFORE UPDATE ON discussion_replies
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_course_materials_modtime
BEFORE UPDATE ON course_materials
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add admin override capabilities
CREATE POLICY "Admins have full access to profiles"
ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to courses"
ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to enrollments"
ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to course materials"
ON course_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Consider adding a function for soft deletes
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add deleted_at column to relevant tables
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE course_materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create soft delete triggers
CREATE TRIGGER soft_delete_courses
BEFORE DELETE ON courses
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_assignments
BEFORE DELETE ON assignments
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_discussions
BEFORE DELETE ON discussions
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_course_materials
BEFORE DELETE ON course_materials
FOR EACH ROW EXECUTE FUNCTION soft_delete();
