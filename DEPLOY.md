# Deploy to GitHub Pages

## Quick Steps:

1. **Commit and push all changes:**
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repo: https://github.com/awwwyeahmuffins/marath0n
   - Click **Settings** (top menu)
   - Scroll down to **Pages** (left sidebar)
   - Under **Source**, select:
     - Branch: `main`
     - Folder: `/ (root)`
   - Click **Save**

3. **Wait for deployment:**
   - GitHub will build and deploy your site
   - Usually takes 1-2 minutes
   - You'll see a green checkmark when it's done

4. **Access your site:**
   - Your app will be live at: **https://awwwyeahmuffins.github.io/marath0n/**

## What I Fixed:

- ✅ Changed all absolute paths (`/pwa/...`) to relative paths (`pwa/...`)
- ✅ Updated service worker to work with GitHub Pages subdirectory
- ✅ Updated manifest.json to use relative paths
- ✅ Added `.nojekyll` file to prevent Jekyll processing

## Notes:

- The site will work at: `https://awwwyeahmuffins.github.io/marath0n/`
- All paths are now relative, so it works both locally and on GitHub Pages
- The service worker will automatically detect if it's on GitHub Pages and adjust paths

## Troubleshooting:

If something doesn't work:
1. Check the GitHub Actions tab for build errors
2. Make sure all files are committed and pushed
3. Clear your browser cache and try again
4. Check the browser console for any errors

