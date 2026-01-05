# Troubleshooting 404 Errors for GIFs

## Status Check:
✅ GIFs ARE on GitHub (verified with curl - all return 200)
✅ Paths are now relative (fixed)
✅ Cache busting added

## The 404s You're Seeing:

### Expected 404s (These GIFs Don't Exist Yet):
- `squat.gif` ❌
- `bench.gif` ❌  
- `deadlift.gif` ❌
- `press.gif` ❌
- `rdl.gif` ❌

These are **normal** - you haven't added the lifting exercise GIFs yet.

### Should Work (These Exist):
- `wall-sit.gif` ✅
- `step-downs.gif` ✅
- `soleus.gif` ✅
- `band-walks.gif` ✅
- `couch-stretch.gif` ✅
- `calf-stretch.gif` ✅
- `hamstring-floss.gif` ✅
- `ankle-rocks.gif` ✅
- `hips-9090.gif` ✅

## Fix Steps:

### 1. Clear Service Worker Cache:
Open browser console and run:
```javascript
caches.keys().then(names => {
  names.forEach(name => {
    if (name.includes('marathon-tracker')) {
      caches.delete(name);
      console.log('Deleted cache:', name);
    }
  });
});
location.reload();
```

### 2. Hard Refresh:
- **Mac**: Cmd+Shift+R
- **Windows/Linux**: Ctrl+Shift+R

### 3. Unregister Service Worker:
In browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service workers unregistered');
  location.reload();
});
```

### 4. Push Latest Changes:
```bash
git add app.js pwa/sw.js
git commit -m "Fix GIF paths and update service worker cache"
git push origin main
```

### 5. Wait 2-3 minutes for GitHub Pages to update

## Verify GIFs Are Working:
After clearing cache, check browser Network tab:
- Should see 200 status for existing GIFs
- 404s are expected for missing lifting GIFs (squat, bench, etc.)

## If Still Not Working:
1. Check browser console for exact error messages
2. Verify you're on: `https://awwwyeahmuffins.github.io/marath0n/`
3. Check Network tab to see what URLs are being requested
4. Make sure you've pushed all changes to GitHub

