import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://eefjvjhaamowdmrzpvfu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZmp2amhhYW1vd2RtcnpwdmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTY0MTMsImV4cCI6MjA4NjU3MjQxM30.CEg7IRxC3GhMtd2C0SstCJLzeoZvXQ8sgbibQ0PL-rU"
);