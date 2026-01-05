# Fix GIF 404 Errors on GitHub Pages

## The Problem:
The GIFs are tracked in git locally but getting 404s on GitHub Pages. This means they need to be pushed to GitHub.

## Solution:

### Step 1: Make sure all GIFs are committed
```bash
git add pwa/exercises/*.gif
git status  # Verify they're staged
```

### Step 2: Commit and push
```bash
git commit -m "Add exercise GIFs"
git push origin main
```

### Step 3: Wait for GitHub Pages to update
- GitHub Pages usually updates within 1-2 minutes
- Check: https://github.com/awwwyeahmuffins/marath0n/tree/main/pwa/exercises
- You should see all 9 GIF files there

### Step 4: Clear browser cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or clear cache in browser settings

## Note about Large Files:
Some GIFs are large (3-4MB). If GitHub Pages still has issues:
1. Optimize them using https://ezgif.com/optimize
2. Aim for < 1MB each for better performance
3. Re-commit and push optimized versions

## Missing GIFs:
You're missing these lifting exercise GIFs (they'll show 404s but that's expected):
- squat.gif
- bench.gif  
- deadlift.gif
- press.gif
- rdl.gif

These can be downloaded from Pixabay when you have time.

