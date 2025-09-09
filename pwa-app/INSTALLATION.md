# 📱 Installation Guide

## Quick Start

**Step 1: Install Dependencies**
```bash
cd pwa-app
npm install
```

**Step 2: Start PWA Server**
```bash
npm run dev
```

**Step 3: Access on Mobile**
- Desktop: `http://localhost:3001`
- Mobile: `http://YOUR_IP:3001`

## 📱 Add to Home Screen

### iPhone (Safari)
1. Open `http://YOUR_IP:3001` in Safari
2. Tap the **Share** button (📤)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. App icon appears on your home screen!

### Android (Chrome)
1. Open `http://YOUR_IP:3001` in Chrome
2. Tap the **Menu** (⋮ three dots)
3. Tap **"Add to Home screen"**
4. Tap **"Add"** to confirm
5. App icon appears in your app drawer!

## ✅ Features You'll Get

🔐 **Same Login** - Use your LingoToday website credentials  
📊 **Live Data** - Real progress, streaks, and lesson data  
📱 **Native Feel** - Full-screen app experience  
🏠 **Bottom Navigation** - Home and Profile tabs  
📚 **Lessons** - Start your next lesson directly  
🔔 **Push Ready** - Infrastructure for mobile notifications  
⚡ **Offline** - Works without internet connection  

## 🔧 Troubleshooting

**Can't access from phone?**
- Make sure both devices are on same WiFi
- Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Try: `http://192.168.x.x:3001`

**PWA not installing?**
- Use Safari on iPhone (not Chrome)
- Use Chrome on Android (not Firefox)
- Make sure you're accessing via HTTP/HTTPS

**Login not working?**
- Ensure main backend is running on port 5000
- Check browser console for errors
- Verify same network access

## 🚀 Ready for Production

This PWA is production-ready and can be:
- Deployed to any web server
- Submitted to app stores as wrapped PWA
- Used as standalone mobile app
- Enhanced with native device features