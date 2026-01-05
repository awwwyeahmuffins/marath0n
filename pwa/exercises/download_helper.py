#!/usr/bin/env python3
"""
Helper script to download free exercise GIFs from Pixabay
Note: Pixabay requires manual download, but this script provides direct links
"""

import webbrowser
import os

# Exercise mappings: (search_term, filename)
EXERCISES = [
    # Lifting
    ("squat exercise", "squat.gif"),
    ("bench press", "bench.gif"),
    ("deadlift", "deadlift.gif"),
    ("overhead press", "press.gif"),
    ("romanian deadlift", "rdl.gif"),
    # Knee
    ("wall sit", "wall-sit.gif"),
    ("step down exercise", "step-downs.gif"),
    ("calf raise", "soleus.gif"),
    ("lateral band walk", "band-walks.gif"),
    # Mobility
    ("hip flexor stretch", "couch-stretch.gif"),
    ("calf stretch", "calf-stretch.gif"),
    ("hamstring stretch", "hamstring-floss.gif"),
    ("ankle mobility", "ankle-rocks.gif"),
    ("hip stretch", "hips-9090.gif"),
]

def main():
    print("=" * 60)
    print("FREE EXERCISE GIF DOWNLOAD HELPER")
    print("=" * 60)
    print("\nThis will open Pixabay search pages for each exercise.")
    print("Pixabay is 100% free, no attribution required.\n")
    
    input("Press Enter to start opening search pages...")
    
    base_url = "https://pixabay.com/gifs/search/"
    
    for search_term, filename in EXERCISES:
        search_url = base_url + search_term.replace(" ", "%20") + "/"
        print(f"\nOpening: {search_term} -> {filename}")
        print(f"URL: {search_url}")
        webbrowser.open(search_url)
        
        response = input(f"Downloaded {filename}? (y/n/q): ").lower()
        if response == 'q':
            break
        elif response == 'y':
            # Check if file exists
            if os.path.exists(filename):
                print(f"✓ {filename} found in current directory")
            else:
                print(f"⚠ {filename} not found - make sure to save it here")
    
    print("\n" + "=" * 60)
    print("Done! Make sure all GIFs are in the /pwa/exercises/ folder")
    print("=" * 60)

if __name__ == "__main__":
    main()

