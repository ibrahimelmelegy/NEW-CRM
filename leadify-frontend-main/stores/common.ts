import { defineStore } from 'pinia';
// ImageUploader import moved to action to prevent SSR crash
import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';

export const useMain = defineStore('Main', {
  state: () => ({
    filereturned: '' as string,
    contentImagesUrls: [] as string[], // تعريف النوع كـ string[] بدلاً من never[]

    openedNav: true,
    mobile: false,
    fullNav: true,
    hideNav: false,
    permissions: [] as string[],
    isLight: false,

    months: [
      { label: 'January', value: 1 },
      { label: 'February', value: 2 },
      { label: 'March', value: 3 },
      { label: 'April', value: 4 },
      { label: 'May', value: 5 },
      { label: 'June', value: 6 },
      { label: 'July', value: 7 },
      { label: 'August', value: 8 },
      { label: 'September', value: 9 },
      { label: 'October', value: 10 },
      { label: 'November', value: 11 },
      { label: 'December', value: 12 }
    ]
  }),

  actions: {
    async uploadFile(model: string, file: File) {
      const extension = file.name.slice(file.name.lastIndexOf('.'));
      const fileName = `HPT-${new Date().getTime()}${extension}`;
      const runtimeConfig = useRuntimeConfig();

      const myRenamedFile = new File([file], fileName, { type: file.type });

      // حل مشكلة useAsyncGql: تأكد من تثبيت nuxt-graphql-client
      // واستخدمها بهذا الشكل أو استبدلها بـ Gql-prefix لو متاحة
      try {
        // @ts-ignore
        const { data } = await useAsyncGql('generateUploadLink', {
          model: model.toUpperCase(),
          fileName,
          contentType: file.type,
          sizeInBytes: file.size
        });

        const link = data.value?.generateUploadLink.data;

        await $fetch(link, {
          method: 'PUT',
          body: myRenamedFile
        });

        const filereturned = link?.split('?')[0].split(runtimeConfig.public.BUCKET_URL)[1];
        return filereturned;
      } catch (error: unknown) {
        ElNotification({
          title: 'Error',
          type: 'error',
          message: error instanceof Error ? error.message : 'Upload failed'
        });
        throw error;
      }
    },

    uploadImagEditor() {
      const runtimeConfig = useRuntimeConfig();
      // Ensure we are on client-side
      if (import.meta.server) return null;

      // Dynamic import to prevent SSR crash
      // We return the structure expected by Quill, but the module is loaded lazily or we assume it's available via plugin
      // However, for this store, we can try to return the config object directly if the module is handled by the component.
      // But based on usage, it seems this is passed to modules: { ... }

      // FIX: Return a safe object that loads the module only when needed or just assume the component handles it.
      // Better yet, let's just dynamic import it here if possible, but synchronous return is expected usually?
      // If synchronous return is needed, we must use a client-only guard at the component level.
      // But here, let's try to make the module import safe.

      let ImageUploaderModule;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        ImageUploaderModule = require('quill-image-uploader');
      } catch (e) {
        logger.warn('Quill Image Uploader not loaded');
        return {};
      }

      return {
        name: 'imageUploader',
        module: ImageUploaderModule.default || ImageUploaderModule,
        options: {
          upload: async (file: File) => {
            try {
              const fileAdded = await this.uploadFile('BLOG_COVER', file);
              if (fileAdded) {
                this.contentImagesUrls.push(fileAdded);
                return runtimeConfig.public.BUCKET_URL + fileAdded;
              }
            } catch (error) {
              logger.error('Error:', error);
              throw new Error('Upload failed');
            }
          }
        }
      };
    }
  }
});

// تحويل الدالة لـ Typed Function
export function fileToDataUrl(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target?.result || null);
    };

    reader.onerror = function () {
      reject(new Error('Error reading the file.'));
    };

    reader.readAsDataURL(file);
  });
}
