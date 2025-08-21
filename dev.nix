# In your dev.nix file

{ pkgs, ... }:

let
  # ... other definitions
in {
  # ... other configurations

  idx.previews.previews = {
    # Find the preview that corresponds to your Next.js/Genkit app
    # The name here might be different in your file, e.g., 'web', 'app', etc.
    AI Caller = { # <--- Replace 'yourAppPreviewName' with the actual name from your dev.nix
      # ... other preview settings (like command, directory, etc.)

      # **THIS IS WHERE YOU ADD YOUR VARIABLES FOR THE STUDIO PREVIEW**
      env = {
        # Add any other NEXT_PUBLIC_ variables your app requires
        # e.g., NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSy...";
        # e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID = "AI Caller";
      };

      # ... potentially other preview settings
    };

    # ... configurations for other previews if you have them
  };

  # ... rest of your dev.nix file
}
