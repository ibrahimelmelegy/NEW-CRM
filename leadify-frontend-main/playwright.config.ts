import { test, expect } from '@playwright/test';

test('التأكد من أن لوحة التحكم تعمل', async ({ page }) => {
    // سيذهب للـ baseURL (http://localhost:3060) الذي حددناه في الـ config
    await page.goto('/');

    // التأكد من أن عنوان الصفحة يحتوي على اسم مشروعك
    await expect(page).toHaveTitle(/App HP Tech/);
});

test('فحص الوصول لصفحة المشاريع والتحقق من الفورم', async ({ page }) => {
    await page.goto('/login');

    // تسجيل دخول سريع (استبدل البيانات ببيانات تست حقيقية)
    await page.getByPlaceholder('name@company.com').fill('admin@hp-tech.com');
    await page.getByPlaceholder('••••••••').fill('Heroo@1502');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // الذهاب لصفحة المشاريع
    await page.goto('/operations/projects');

    // التأكد من ظهور زر إضافة مشروع جديد
    const newProjectBtn = page.getByRole('button', { name: 'New Project' });
    await expect(newProjectBtn).toBeVisible();

    // ضغطة تجريبية لفتح الفورم
    await newProjectBtn.click();

    // التأكد من أن الفورم فتح بنجاح
    await expect(page.getByText('Project Name')).toBeVisible();
});