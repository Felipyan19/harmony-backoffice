import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const BOGOTA_TIME_ZONE = 'America/Bogota';

export function formatRelativeDate(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return 'Fecha inválida';

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: es,
  });
}

export function formatBogotaTime(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '--:--';

  return formatInTimeZone(date, BOGOTA_TIME_ZONE, 'HH:mm');
}

export function normalizePhoneNumber(value: string, defaultCountry: 'CO' = 'CO') {
  const phone = parsePhoneNumberFromString(value, defaultCountry);

  if (!phone?.isValid()) {
    return {
      isValid: false,
      e164: value,
      display: value,
    };
  }

  return {
    isValid: true,
    e164: phone.number,
    display: phone.formatInternational(),
  };
}
