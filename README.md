# HP Tech CRM System

نظام إدارة علاقات العملاء (CRM) متكامل لشركة HP Tech.

## 📋 المتطلبات

- **Node.js** v18+
- **Docker Desktop** (للـ Database)
- **npm** أو **yarn**

## 🚀 التشغيل السريع

### الطريقة الأولى: سكريبت التشغيل التلقائي

```bash
# من المجلد الرئيسي
.\start-all.bat
```

هذا السكريبت سيقوم تلقائياً بـ:
1. التحقق من Docker
2. تشغيل قاعدة البيانات
3. تشغيل Backend على Port 5000
4. تشغيل Frontend على Port 3060

### الطريقة الثانية: التشغيل اليدوي

#### 1. تشغيل قاعدة البيانات (Docker)
```bash
cd leadify-backend-main
docker-compose up -d
```

#### 2. تشغيل Backend
```bash
cd leadify-backend-main
npm install  # أول مرة فقط
npm run dev
```

#### 3. تشغيل Frontend
```bash
cd leadify-frontend-main
npm install  # أول مرة فقط
npm run dev
```

## 🔐 بيانات الدخول (Super Admin)

Default admin credentials are configured via environment variables during the `npm run seed` process.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file before running seed.

> **WARNING**: Change the default admin password immediately after first login in production.

## 🌐 الروابط

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3060 |
| **Backend API** | http://localhost:5000 |
| **API Documentation** | http://localhost:5000/api-docs |

## 📁 هيكل المشروع

```
HP-Tech-CRM/
├── leadify-backend-main/     # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── user/             # User & Auth modules
│   │   ├── role/             # Roles & Permissions
│   │   ├── lead/             # Leads management
│   │   ├── client/           # Clients management
│   │   ├── project/          # Projects management
│   │   └── ...
│   ├── docker-compose.yml    # Database configuration
│   └── .env                  # Environment variables
│
├── leadify-frontend-main/    # Frontend (Nuxt 3 + Vue 3)
│   ├── pages/                # Application pages
│   ├── components/           # Vue components
│   ├── composables/          # Composition API utilities
│   └── .env                  # Frontend environment variables
│
├── start-all.bat             # سكريبت تشغيل كل الخدمات
└── diagnose.bat              # سكريبت تشخيص المشاكل
```

## 🛠️ الأوامر المتاحة

### Backend
```bash
npm run dev      # تشغيل بوضع التطوير
npm run build    # بناء للإنتاج
npm run seed     # إنشاء البيانات الأساسية
```

### Frontend
```bash
npm run dev      # تشغيل بوضع التطوير
npm run build    # بناء للإنتاج
npm run generate # إنشاء Static Site
```

## 🔧 استكشاف الأخطاء

### إذا واجهت مشاكل في التشغيل:

```bash
.\diagnose.bat
```

### مشاكل شائعة:

1. **"User not found" عند تسجيل الدخول:**
   ```bash
   cd leadify-backend-main
   npm run seed
   ```

2. **"Port already in use":**
   - أوقف أي تطبيقات تستخدم Port 5000 أو 3060

3. **"Database connection failed":**
   - تأكد من تشغيل Docker Desktop
   - شغل: `docker-compose up -d`

## 📱 الميزات الرئيسية

- ✅ إدارة العملاء المحتملين (Leads)
- ✅ إدارة العملاء (Clients)
- ✅ إدارة الفرص (Opportunities)
- ✅ إدارة الصفقات (Deals)
- ✅ إدارة المشاريع (Projects)
- ✅ إدارة العروض (Proposals)
- ✅ إدارة الموظفين والصلاحيات
- ✅ لوحة تحكم إحصائية (Dashboard)
- ✅ تقارير وتصدير البيانات

## 📄 License

© 2024 HP Tech. All rights reserved.
