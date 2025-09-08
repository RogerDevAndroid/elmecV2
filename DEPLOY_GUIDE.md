# 🚀 ElmecV2 Deployment Guide

## Preparación para Deploy

### ✅ Ya Configurado
- ✅ Database setup (Supabase)
- ✅ Authentication system
- ✅ Environment variables
- ✅ Build scripts
- ✅ App configuration

## 📱 Opciones de Deployment

### 1. **Expo Development Build** (Recomendado para testing)
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login a Expo
eas login

# Inicializar proyecto
eas init

# Build para desarrollo
eas build --profile development --platform android
eas build --profile development --platform ios
```

### 2. **Expo Go** (Para desarrollo rápido)
```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Escanear QR con Expo Go app
```

### 3. **Production Builds**
```bash
# Build para Android
eas build --platform android

# Build para iOS  
eas build --platform ios

# Build para ambas plataformas
eas build
```

### 4. **Web Deployment**
```bash
# Build para web
npm run build:web

# Deploy a Netlify/Vercel
# Upload dist/ folder
```

## 🌍 Deployment Platforms

### **Expo Application Services (EAS)**
- ✅ **Más fácil**: Configuración automática
- ✅ **Builds en la nube**: No necesitas XCode/Android Studio
- ✅ **Updates OTA**: Updates sin store approval

```bash
# Deploy process
eas login
eas init
eas build --platform all
eas submit --platform android  # Para Play Store
eas submit --platform ios      # Para App Store
```

### **Netlify** (Para versión web)
```bash
# Connect GitHub repo a Netlify
# Build command: npm run build:web
# Publish directory: dist
```

### **Vercel** (Para versión web)
```bash
vercel --prod
```

## 🔧 Pre-Deployment Checklist

### 1. **Instalar dependencias faltantes**
```bash
npm install @supabase/supabase-js expo-secure-store
```

### 2. **Configurar EAS Project ID**
```bash
# In app.json, update:
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

### 3. **Test localmente**
```bash
npm run test
npm run dev
```

### 4. **Configurar contraseñas en Supabase**
- Ve a [Supabase Auth](https://app.supabase.com/project/aoghysichevnuaddsocl/auth/users)
- Establece contraseñas para usuarios demo

## 🚀 Quick Deploy Commands

### **Development Deploy** (15 min)
```bash
# 1. Install EAS CLI
npm install -g @expo/eas-cli

# 2. Login
eas login

# 3. Initialize
eas init

# 4. Build development version
eas build --profile development --platform android

# 5. Install on device
# Download APK from build page
```

### **Production Deploy** (30 min)
```bash
# 1. Build production
eas build --profile production

# 2. Submit to stores
eas submit --platform android
eas submit --platform ios
```

### **Web Deploy** (5 min)
```bash
# 1. Build web
npm run build:web

# 2. Deploy to Netlify
# Drag dist/ folder to netlify.com/drop
```

## 📋 Next Steps After Deploy

1. **Test Authentication**: Login with demo users
2. **Test Database**: Create support request
3. **Test Real-time**: Send messages in chat
4. **Set up monitoring**: Configure Sentry or similar
5. **Configure push notifications**: Set up Expo Push
6. **Set up analytics**: Configure analytics service

## 🔗 Useful Links

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Submit](https://docs.expo.dev/submit/introduction/)
- [Supabase Dashboard](https://app.supabase.com/project/aoghysichevnuaddsocl)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

## 🆘 Common Issues

### Build fails?
```bash
# Clear cache
expo start --clear
npm run prebuild
```

### Environment variables not working?
- Check `.env` file exists
- Verify `EXPO_PUBLIC_` prefix for client vars
- Restart development server

### Database connection issues?
- Verify Supabase keys in `.env`
- Check RLS policies are enabled
- Test with `npm run test`