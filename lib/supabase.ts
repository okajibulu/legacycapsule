import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://zclmllbfuekyeshiihgt.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbG1sbGJmdWVreWVzaGlpaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDkxNDIsImV4cCI6MjA5MjcyNTE0Mn0.P3jjs-xcbGCJAVgAwQYkC_XpU0-sgxngvMCE4q0xQjc"

export const supabase = createClient(supabaseUrl, supabaseKey)