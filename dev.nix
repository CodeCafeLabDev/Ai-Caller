# In your dev.nix file

{ pkgs, ... }:

let
  # ... other definitions
in {
  # ... other configurations

  idx.previews.previews = {
    # Find the preview that corresponds to your Next.js/Genkit app
    # The name here might be different in your file, e.g., 'web', 'app', etc.
    Voxaiomni = { # <--- Replace 'yourAppPreviewName' with the actual name from your dev.nix
      # ... other preview settings (like command, directory, etc.)

      # **THIS IS WHERE YOU ADD YOUR VARIABLES FOR THE STUDIO PREVIEW**
      env = {
        NEXT_PUBLIC_SUPABASE_URL = "https://pjpuivahnacrpmwwlvbq.supabase.co";       # <--- Add this line
        NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcHVpdmFobmFjcnBtd3dsdmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTIwNjgsImV4cCI6MjA2NDc2ODA2OH0.IUXrdiSIx3SFCjTiaKmAqHPsv9FRrPQlZmBE9-UBB8U"; # <--- Add this line (if needed)
        # Add any other NEXT_PUBLIC_ variables your app requires
        # e.g., NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSy...";
        # e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID = "voxaiomni";
      };

      # ... potentially other preview settings
    };

    # ... configurations for other previews if you have them
  };

  # ... rest of your dev.nix file
}
