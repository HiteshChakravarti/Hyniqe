# ⚡ HYNIQE Quick Start Guide

Get your website live in 30 minutes! Follow these steps exactly.

---

## ✅ **Pre-Flight Checklist**

Before you begin:
- [ ] Cursor.ai installed
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Your 3D character images ready (5 PNG/WebP files)

---

## 🚀 **Step 1: Setup Project (5 minutes)**

### **1.1 Create React Project**
```bash
npm create vite@latest hyniqe -- --template react-ts
cd hyniqe
```

### **1.2 Install Dependencies**
```bash
npm install
npm install motion lucide-react
```

### **1.3 Start Dev Server**
```bash
npm run dev
```

✅ **Check**: Open http://localhost:5173 - you should see Vite default page

---

## 📂 **Step 2: Copy Files (5 minutes)**

### **2.1 From Figma Make → Cursor.ai**

**Copy these files:**

1. **Root files:**
   - `/App.tsx` → `src/App.tsx`
   - `/styles/globals.css` → `src/index.css`

2. **Components folder:**
   - `/components/Navigation.tsx` → `src/components/Navigation.tsx`
   - `/components/Hero.tsx` → `src/components/Hero.tsx`
   - `/components/AIHelpers.tsx` → `src/components/AIHelpers.tsx`
   - `/components/HowItWorks.tsx` → `src/components/HowItWorks.tsx`
   - `/components/Features.tsx` → `src/components/Features.tsx`
   - `/components/Pricing.tsx` → `src/components/Pricing.tsx`
   - `/components/Testimonials.tsx` → `src/components/Testimonials.tsx`
   - `/components/FAQ.tsx` → `src/components/FAQ.tsx`
   - `/components/FinalCTA.tsx` → `src/components/FinalCTA.tsx`
   - `/components/Footer.tsx` → `src/components/Footer.tsx`

3. **Protected component:**
   - `/components/figma/ImageWithFallback.tsx` → `src/components/figma/ImageWithFallback.tsx`

### **2.2 Update App.tsx Import**

In `src/App.tsx`, change line 11:
```tsx
import './styles/globals.css';  // ❌ Old
import './index.css';           // ✅ New
```

✅ **Check**: Refresh browser - website should load!

---

## 🖼️ **Step 3: Replace Images (10 minutes)**

### **3.1 Prepare Your Images**

Save your 5 AI character images as:
- `estel.png` (Purple Elephant)
- `karo.png` (Orange Dog)
- `niki.png` (Cyan Bird)
- `orin.png` (Green Owl)
- `turbo.png` (Orange Tiger)

### **3.2 Add to Project**

Place images in: `public/characters/`

### **3.3 Update AIHelpers.tsx**

In `src/components/AIHelpers.tsx`, replace Unsplash URLs (lines 15, 25, 35, 45, 55):

**Before:**
```tsx
image: 'https://images.unsplash.com/photo-1651111139316...',
```

**After:**
```tsx
image: '/characters/estel.png',
```

Do this for all 5 characters.

✅ **Check**: Refresh - you should see your character images!

---

## 🎨 **Step 4: Customize Content (5 minutes)**

### **4.1 Update Brand Name (Optional)**

If you want to change "HYNIQE" to your brand:

**Search & Replace in all files:**
- `HYNIQE` → `YourBrand`

### **4.2 Update Copy**

Edit these files with your actual content:
- `Hero.tsx` - Main headline and description
- `AIHelpers.tsx` - AI employee descriptions
- `Testimonials.tsx` - Real customer quotes
- `Footer.tsx` - Your company links

✅ **Check**: Content looks good!

---

## 🧪 **Step 5: Test (5 minutes)**

### **5.1 Desktop Test**
```
Browser: Chrome/Firefox/Safari
Viewport: 1920x1080
```
- [ ] All sections load
- [ ] Animations work
- [ ] Navigation works
- [ ] All images show
- [ ] No console errors

### **5.2 Mobile Test**
```
Browser: Chrome DevTools
Viewport: iPhone 14 Pro (393x852)
```
- [ ] Hamburger menu works
- [ ] Swipeable carousel works
- [ ] All text readable
- [ ] Buttons easy to tap
- [ ] No horizontal scroll

✅ **Check**: Works on both!

---

## 🚢 **Step 6: Deploy (5 minutes)**

### **Option A: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Your site will be live at: `https://your-project.vercel.app`

### **Option B: Netlify**

```bash
# Build
npm run build

# Drag /dist folder to netlify.com/drop
```

### **Option C: Manual**

```bash
# Build
npm run build

# Upload /dist/* to your hosting
```

✅ **Check**: Site is live!

---

## ⚙️ **Step 7: Post-Deploy (Optional)**

### **7.1 Add SEO**

In `index.html`:
```html
<head>
  <title>HYNIQE - Lightning Fast AI Employees</title>
  <meta name="description" content="Deploy specialized AI employees in seconds. Meet your AI workforce.">
</head>
```

### **7.2 Add Analytics**

```tsx
// In App.tsx
useEffect(() => {
  // Google Analytics
  window.gtag('config', 'GA_MEASUREMENT_ID');
}, []);
```

### **7.3 Add Favicon**

1. Create `favicon.svg` or `favicon.png`
2. Place in `public/`
3. Reference in `index.html`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

---

## 🎉 **You're Live!**

### **What You Have Now:**
✅ Fully responsive website
✅ 10 complete sections
✅ Premium animations
✅ Your branding
✅ Production-ready
✅ Live on the internet!

### **Share Your Site:**
```
🌐 URL: https://your-domain.com
📱 Mobile: Works perfectly
💻 Desktop: Full experience
⚡ Speed: Blazing fast
```

---

## 🆘 **Troubleshooting**

### **Problem: Blank page**
```bash
# Check console for errors
# Most common: Import path wrong

# Fix: Check all imports use ./components/ not /components/
```

### **Problem: Images not loading**
```bash
# Check: Images in /public folder?
# Check: Paths start with / not ./
# Fix: Use /characters/estel.png not ./characters/estel.png
```

### **Problem: Animations choppy**
```bash
# Check: Running on laptop? Try desktop
# Check: Close other tabs
# Fix: Reduce particle count in Hero.tsx (line 42: 30 → 20)
```

### **Problem: Build fails**
```bash
# Check: TypeScript errors?
# Fix: Run npm run build and read errors
# Most common: Missing component imports
```

---

## 📞 **Next Steps**

### **Week 1:**
- [ ] Monitor analytics
- [ ] Collect user feedback
- [ ] Fix any issues
- [ ] Test on real devices

### **Week 2:**
- [ ] Add contact form
- [ ] Set up email capture
- [ ] Launch marketing
- [ ] A/B test CTAs

### **Month 1:**
- [ ] Add blog
- [ ] Create resources
- [ ] Build community
- [ ] Scale traffic

---

## 🎓 **Resources**

- **Documentation**: See README.md
- **Deployment**: See DEPLOYMENT-GUIDE.md
- **Visual Guide**: See VISUAL-STRUCTURE.md
- **Full Summary**: See PROJECT-SUMMARY.md

---

## ✨ **Congratulations!**

You just launched a premium, production-ready website in 30 minutes!

**What's Next?**
- Share on social media
- Submit to directories
- Launch paid ads
- Grow your audience
- Build your business!

---

🚀 **Happy Launching!**

© 2025 HYNIQE - Built with ❤️ for modern teams
