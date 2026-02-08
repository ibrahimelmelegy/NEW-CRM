export function capitalizeFirstLetter(str: string) {
  if (str) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return '';
}
export function fromCamelCase(camelCaseStr: string) {
  const spacedStr = camelCaseStr.replace(/([A-Z])/g, ' $1');
  return spacedStr.charAt(0).toUpperCase() + spacedStr.slice(1);
}

export function formatIso(dateText: any) {
  const date = new Date(dateText);

  // Get year, month, and day part from the date
  const year = date.toLocaleString('default', { year: 'numeric' });
  const month = date.toLocaleString('default', { month: '2-digit' });
  const day = date.toLocaleString('default', { day: '2-digit' });

  const formattedDate = year + '-' + month + '-' + day;
  return dateText ? formattedDate : 'Not Mentioned';
}
export function formatSaudiIso(dateText: any = new Date()) {
  const date = new Date(dateText); // Create a Date object from the timestamp
  const formattedDate = date.toLocaleString('af-ZA', {
    timeZone: 'Asia/Riyadh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return formattedDate.replace(' ', 'T') + '+0300';
  // return formattedDate;
}

function getDaySuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function formatTime(days: any, hours: any, minutes: any, seconds: any) {
  const timeParts = [];

  if (days) {
    timeParts.push(days + 'd');
  }
  if (hours) {
    timeParts.push(hours + 'h');
  }
  if (minutes) {
    timeParts.push(minutes + 'min');
  }
  if (seconds) {
    timeParts.push(seconds + 's');
  }

  if (timeParts.length >= 2) {
    return timeParts.slice(0, 2).join('');
  } else if (timeParts.length === 0) {
    return '0s';
  } else {
    return timeParts.join('');
  }
}
export function calculateAge(year: any, month: any, days: any) {
  const age = [];

  if (year) {
    age.push(year + ' y/o');
  } else if (days) {
    age.push(days + ' d/o');
  }

  if (age.length === 0) {
    return '0d';
  } else {
    return age.join('');
  }
}

export function formatTextWithUnderscore(input: string) {
  if (input) {
    const words = input.split('_');

    const formattedWords = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return formattedWords.join(' ');
  }
  return ' ';
}

export function formatTextWithyphen(input: string) {
  if (input.includes('_')) {
    const route = removeIdPart(input);

    const regex = /^[a-z]+(?:[A-Z][a-z]*)*$/;
    if (regex.test(route)) {
      const regex = /([a-z])([A-Z])/g;
      return capitalizeFirstLetter(route.replace(regex, '$1 $2'));
    } else {
      return capitalizeFirstLetter(route);
    }
  }
  const words = input.split('-');
  const formattedWords = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return formattedWords.join(' ');
}
export function removeIdPart(input: string) {
  const words = input.split('_');
  words.pop();

  return words.join(' ');
}

export function formatName(input: string) {
  const words = input.split(' ');
  const formattedWords = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  return formattedWords.join(' ');
}

export function timestampToHour(timestamp: any) {
  const time = new Date(timestamp).toLocaleTimeString('en-SA', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: 'numeric'
  });

  return timestamp ? time : 'Not mentioned';
}
export function getDateandTime(timeStamp: any) {
  const time = new Date(timeStamp).toLocaleTimeString('en-SA', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: 'numeric'
  });
  const date = formatDate(timeStamp);

  return {
    time: timeStamp ? time : 'NOt mentioned',
    date: timeStamp ? date : 'Not mentioned'
  };
}

export function formatDatetoText(timestamp: any) {
  const dateObj = new Date(timestamp);

  // Format the date object as a string in the desired format
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }); // Output: "Dec 12, 2023"
  return timestamp ? formattedDate : 'Not mentioned';
}

export function checkEmpty(text: any) {
  return text || 'Not mentioned';
}

export function checkDateLength(date: any) {
  return String(date).length > 1 ? String(date) : `0${date}`;
}
// Helper function to normalize phone numbers
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^2/, ''); // Assuming removing country code prefix '2', modify if needed
}

export function capitalizeName(name: string) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatLargeNumber(num: number | string) {
  const n = Number(num);
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'k';
  }
  return n.toString();
}

export const formatDate = (date: string | Date, format: string = 'DD MMM YYYY') => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function getYear(date: string | Date | null | undefined) {
  if (!date) return '-';
  try {
    return new Date(date).getFullYear().toString();
  } catch (e) {
    return '-';
  }
}

export const formatSnakeCase = (str: string) => {
  if (!str) return '-';
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
