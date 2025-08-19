-- Add visibility flags to lectures and sections
ALTER TABLE "Lecture" ADD COLUMN IF NOT EXISTS "public" boolean NOT NULL DEFAULT true;
ALTER TABLE "LectureSection" ADD COLUMN IF NOT EXISTS "public" boolean NOT NULL DEFAULT true;


