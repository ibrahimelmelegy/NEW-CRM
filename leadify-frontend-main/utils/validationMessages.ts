/**
 * Translated Yup Validation Messages
 * Use with Yup's setLocale() for i18n support
 */

export interface ValidationMessages {
  mixed: {
    required: string | ((params: { path: string }) => string);
    default: string;
  };
  string: {
    email: string;
    min: string | ((params: { min: number }) => string);
    max: string | ((params: { max: number }) => string);
    matches: string;
    url: string;
  };
  number: {
    min: string | ((params: { min: number }) => string);
    max: string | ((params: { max: number }) => string);
    positive: string;
    integer: string;
  };
}

export const validationMessagesEn: ValidationMessages = {
  mixed: {
    required: ({ path }) => `${path} is required`,
    default: 'Invalid value'
  },
  string: {
    email: 'Please enter a valid email address',
    min: ({ min }) => `Must be at least ${min} characters`,
    max: ({ max }) => `Must not exceed ${max} characters`,
    matches: 'Invalid format',
    url: 'Please enter a valid URL'
  },
  number: {
    min: ({ min }) => `Must be at least ${min}`,
    max: ({ max }) => `Must not exceed ${max}`,
    positive: 'Must be a positive number',
    integer: 'Must be a whole number'
  }
};

export const validationMessagesAr: ValidationMessages = {
  mixed: {
    required: ({ path }) => `حقل ${path} مطلوب`,
    default: 'قيمة غير صالحة'
  },
  string: {
    email: 'الرجاء إدخال بريد إلكتروني صالح',
    min: ({ min }) => `يجب أن يكون على الأقل ${min} أحرف`,
    max: ({ max }) => `يجب ألا يتجاوز ${max} حرف`,
    matches: 'تنسيق غير صالح',
    url: 'الرجاء إدخال رابط صالح'
  },
  number: {
    min: ({ min }) => `يجب أن يكون على الأقل ${min}`,
    max: ({ max }) => `يجب ألا يتجاوز ${max}`,
    positive: 'يجب أن يكون رقم موجب',
    integer: 'يجب أن يكون رقم صحيح'
  }
};

/**
 * Get validation messages based on locale
 */
export const getValidationMessages = (locale: 'en' | 'ar'): ValidationMessages => {
  return locale === 'ar' ? validationMessagesAr : validationMessagesEn;
};

/**
 * Custom validation error messages for common fields
 */
export const fieldLabels = {
  en: {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    phone: 'Phone Number',
    address: 'Address',
    city: 'City',
    country: 'Country',
    amount: 'Amount',
    date: 'Date',
    description: 'Description',
    title: 'Title'
  },
  ar: {
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    name: 'الاسم',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    city: 'المدينة',
    country: 'الدولة',
    amount: 'المبلغ',
    date: 'التاريخ',
    description: 'الوصف',
    title: 'العنوان'
  }
};

/**
 * Get translated field label
 */
export const getFieldLabel = (field: string, locale: 'en' | 'ar'): string => {
  const labels = fieldLabels[locale];
  return (labels as Record<string, string>)[field] || field;
};
