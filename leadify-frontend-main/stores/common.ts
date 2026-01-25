import { defineStore } from 'pinia';
// @ts-ignore
import ImageUploader from 'quill-image-uploader';
import { ElNotification } from 'element-plus';

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
      { label: 'December', value: 12 },
    ],
  }),

  actions: {
    async uploadFile(model: string, file: File) {
      const extension = file.name.slice(file.name.lastIndexOf('.'));
      let fileName = `HPT-${new Date().getTime()}${extension}`;
      const runtimeConfig = useRuntimeConfig();

      const myRenamedFile = new File([file], fileName, { type: file.type });

      // حل مشكلة useAsyncGql: تأكد من تثبيت nuxt-graphql-client
      // واستخدمها بهذا الشكل أو استبدلها بـ Gql-prefix لو متاحة
      try {
        // @ts-ignore
        const { data } = await useAsyncGql('generateUploadLink', {
          model: model.toUpperCase(),
          fileName: fileName,
          contentType: file.type,
          sizeInBytes: file.size,
        });

        const link = data.value?.generateUploadLink.data;

        await $fetch(link, {
          method: 'PUT',
          body: myRenamedFile,
        });

        const filereturned = link?.split('?')[0].split(runtimeConfig.public.BUCKET_URL)[1];
        return filereturned;
      } catch (error: any) {
        ElNotification({
          title: 'Error',
          type: 'error',
          message: error?.message || 'Upload failed',
        });
        throw error;
      }
    },

    uploadImagEditor() {
      const runtimeConfig = useRuntimeConfig();
      return {
        name: 'imageUploader',
        module: ImageUploader,
        options: {
          upload: async (file: File) => {
            return new Promise(async (resolve, reject) => {
              try {
                const fileAdded = await this.uploadFile('BLOG_COVER', file);
                if (fileAdded) {
                  this.contentImagesUrls.push(fileAdded);
                  resolve(runtimeConfig.public.BUCKET_URL + fileAdded);
                }
              } catch (error) {
                reject('Upload failed');
                console.error('Error:', error);
              }
            });
          },
        },
      };
    },
  },
});

// تحويل الدالة لـ Typed Function
function fileToDataUrl(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file provided.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target?.result || null);
    };

    reader.onerror = function () {
      reject('Error reading the file.');
    };

    reader.readAsDataURL(file);
  });
}