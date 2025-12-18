-- ============================================================================
-- OPTIONAL MIGRATION: Add is_testimony column to prayercircles table
-- ============================================================================
-- 
-- This migration adds the is_testimony column to distinguish between
-- prayer requests and testimonies in the prayercircles table.
--
-- IMPORTANT: This is NON-DESTRUCTIVE - it only adds a new column with a default value.
-- Existing data will NOT be modified or deleted.
--
-- Run this in your Supabase SQL Editor if you want to separate
-- prayers from testimonies in the app.
-- ============================================================================

-- Add is_testimony column with default value of false (prayer request)
ALTER TABLE public.prayercircles 
ADD COLUMN IF NOT EXISTS is_testimony BOOLEAN DEFAULT false;

-- Add is_featured column for featuring content
ALTER TABLE public.prayercircles 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_prayercircles_is_testimony 
ON public.prayercircles(is_testimony);

CREATE INDEX IF NOT EXISTS idx_prayercircles_is_featured 
ON public.prayercircles(is_featured);

-- ============================================================================
-- VERIFICATION: Check the new columns exist
-- ============================================================================
-- Run this to verify the migration was successful:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'prayercircles' 
-- AND column_name IN ('is_testimony', 'is_featured');

-- ============================================================================
-- OPTIONAL: Update existing records if you want to mark some as testimonies
-- ============================================================================
-- Example: Mark specific records as testimonies
-- UPDATE public.prayercircles SET is_testimony = true WHERE id = 'your-uuid-here';
--
-- Example: Mark all records containing "testimony" in title as testimonies
-- UPDATE public.prayercircles SET is_testimony = true 
-- WHERE LOWER(title) LIKE '%testimony%' OR LOWER(title) LIKE '%praise%';
