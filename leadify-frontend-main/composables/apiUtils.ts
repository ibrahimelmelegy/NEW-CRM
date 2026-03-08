import { ElNotification } from 'element-plus';
import { useAuthStore } from '~/stores/auth';

// ✅ Removed top-level useRuntimeConfig to prevent Nuxt context errors

export async function downloadFile(file: string) {
  const authStore = useAuthStore();
  const runtimeConfig = useRuntimeConfig();

  await fetch(`${(runtimeConfig.public as unknown).BASE_URL + file}`, {
    headers: {
      Authorization: `Bearer ${(authStore as unknown).token}`
    }
  })
    .then(async response => {
      // ✅ Fix 1: Safer filename extraction to avoid 'undefined' error
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = file.split('/').pop()?.split('.')[0] || 'download'; // Default fallback

      if (contentDisposition) {
        const match = contentDisposition.split(';').find(n => n.includes('filename='));
        if (match) {
          fileName = match.replace('filename=', '').trim().split('.')[0] || 'download';
        }
      }

      if (response.status !== 200) {
        ElNotification({
          title: 'Error',
          type: 'error',
          message: response.statusText
        });
        throw new Error('Error downloading file');
      } else {
        return { blob: await response.blob(), name: fileName };
      }
    })
    .then(({ blob, name }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((error: unknown) => {
      console.error('File download failed:', error);
      const t = useNuxtApp().$i18n.t;
      ElNotification({
        title: t('common.error'),
        type: 'error',
        message: t('common.downloadFailed')
      });
    });
}

export function uploadFile(params: { file: File; [key: string]: unknown }) {
  return new Promise<string>((resolve, reject) => {
    const file = params.file;

    const extension = file.name.slice(file.name.lastIndexOf('.'));

    const fileName = `File-${new Date().getTime()}${extension}`;
    const myRenamedFile = new File([file], fileName, { type: file.type });
    const runtimeConfig = useRuntimeConfig();

    // ✅ Fix 2: useAsyncGql is auto-imported by Nuxt GQL module
    const _useAsyncGql: unknown = (globalThis as unknown).useAsyncGql;
    _useAsyncGql('generateUploadLink', {
      model: 'BLOG_COVER',
      fileName,
      contentType: file.type,
      sizeInBytes: file.size
    })
      // ✅ Fix 3: Explicitly type the response data
      .then(async ({ data }: { data: Ref<Record<string, unknown>> }) => {
        const gqlResult = data.value?.generateUploadLink as { data: string } | undefined;
        const link = gqlResult?.data;
        try {
          const _response = await $fetch(link as string, {
            method: 'PUT',
            body: myRenamedFile
          });
          const fileTurned = (link?.split('?')[0] as string).split((runtimeConfig.public as unknown).BUCKET_URL)[1];
          resolve(fileTurned as string);
        } catch (error) {
          reject(error);
        }
      })
      .catch((error: unknown) => {
        ElNotification({
          title: 'Error',
          type: 'error',
          message: error instanceof Error ? error.message : String(error)
        });

        reject(error);
      });
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'NEW':
      return 'one';
    case 'CONTACTED':
      return 'two';
    case 'DISQUALIFIED':
      return 'three';
    case 'QUALIFIED':
      return 'primary';
    case 'DISCOVERY':
      return 'one';
    case 'PROPOSAL':
      return 'two';
    case 'NEGOTIATION':
      return 'four';
    case 'LOST':
      return 'three';
    case 'WON':
      return 'primary';
    case 'Very Low':
      return 'six';
    case 'Low':
      return 'primary';
    case 'Medium':
      return 'four';
    case 'High':
      return 'five';
    case 'Very High':
      return 'three';
    case 'AVAILABLE':
      return 'primary';
    case 'NOT_AVAILABLE':
      return 'six';
    case 'PROGRESS':
      return 'four';
    case 'CLOSED':
      return 'two';
    case 'CANCELLED':
      return 'three';
    case 'ACTIVE':
      return 'primary';
    case 'INACTIVE':
      return 'six';
    case 'PROJECT_ACTIVE':
      return 'two';
    case 'PROJECT_CANCELLED':
      return 'three';
    case 'PROJECT_COMPLETED':
      return 'primary';
    case 'PROJECT_ON_HOLD':
      return 'four';
    case 'WAITING_APPROVAL':
      return 'four';
    case 'UNDER_DEVELOPING':
      return 'two';
    case 'FINISHED':
      return 'three';
    case 'UNDER_REVIEW':
      return 'two';
    case 'WAITING_FOR_CONTRACT':
      return 'three';
    case 'CONTRACT_SIGNED':
      return 'four';
    case 'ON_HOLD':
      return 'six';
    case 'COMPLETED':
      return 'four';
    case 'APPROVED':
      return 'primary';
    case 'REJECTED':
      return 'three';
  }
}

export function transformNumToFixed(num: number): string | number {
  return +num % 1 !== 0 ? +num?.toFixed(2) : +num;
}

export function checkStatuesNumber(num: number): string {
  return +num > 0 ? 'Positive' : +num < 0 ? 'Negative' : 'Zero';
}

export function formatNumber(number: number | string) {
  return Number(number)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function unformatNumber(formattedNumber: number | string) {
  if (typeof formattedNumber === 'number') return formattedNumber;
  return +formattedNumber.replace(/,/g, '');
}

export function checkAppointmentType(type: string) {
  switch (type) {
    case 'SCHEDULED':
      return '#FFCE0E';
    case 'URGENT':
      return '#E56461';
    case 'FOLLOW_UP':
      return '#27AE60';
    case 'FREE':
      return '#5789e3';
    default:
      return '#1ED8D6';
  }
}
export function checkPaymentType(type: string) {
  switch (type) {
    case 'APPLE_PAY':
      return '/images/payment/applepay.svg';
    case 'AMERICAN_EXPRESS':
      return '/images/payment/americanExpress.svg';
    case 'VISA':
      return '/images/payment/visa.svg';
    case 'MASTERCARD':
      return '/images/payment/mastercard.svg';
    case 'MAESTRO':
      return '/images/payment/maestro.svg';
    case 'WALLET':
    case 'SYSTEM':
      return '/images/payment/wallet.svg';
    case 'MADA':
      return '/images/payment/mada.svg';
  }
}
export function getRequestStatus(status: string) {
  switch (status) {
    case 'PENDING_DATA_REVIEW':
      return { name: 'To be reviewed', color: '#f1ca32' };
    case 'UPDATE_SFHSC_REGISTERATION_NUMBER':
      return { name: 'SCFHS No. update ', color: '#f1ca32' };
    case 'SENT':
      return { name: 'Contract sent', color: '#159998' };
    case 'RECEIVED':
      return { name: 'Contract signed', color: '#239E57' };
    case 'REJECTED':
    case 'NOT_SENT':
      return { name: 'Rejected', color: '#d1615f' };
    case 'UPDATE_CLASSIFICATION':
      return { name: 'Classification update', color: '#d1615f' };

    case 'ACCEPTED':
      return { name: 'Accepted', color: '#3dd388' };
    case 'REJECTED_BY_CONSULTANT':
      return { name: 'Rejected by provider', color: '#db5b1a' };
  }
}

export function getErrorCode(code: number, message: string | null | undefined) {
  if (code === 600) {
    navigateTo('/login');
  } else if (code > 200) {
    throw createError({
      statusCode: code,
      statusMessage: message || '',
      fatal: true
    });
  }
}
export function convertToReadableFormat(str: string) {
  if (!str) return '';
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();
  return result;
}

export function toUpperSnakeCase(str: string) {
  if (!str) return '';
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

export const getWordInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

let previousColor: string | undefined;
export const randomBgColor = () => {
  const colors = ['#007BFF', '#28A745', '#6C757D'];
  let newColor: string = colors[0] as string;
  do {
    newColor = colors[Math.floor(Math.random() * colors.length)] as string;
  } while (newColor === previousColor);

  previousColor = newColor;

  return newColor;
};
