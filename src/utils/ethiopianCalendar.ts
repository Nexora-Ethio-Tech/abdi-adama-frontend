export type EthiopianDateParts = {
  year: number;
  month: number;
  day: number;
};

const ETHIOPIAN_EPOCH = 1723856;
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

const toJdnFromGregorian = (year: number, month: number, day: number) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};

const jdnToGregorian = (jdn: number) => {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);

  return { year, month, day };
};

const jdnToEthiopian = (jdn: number): EthiopianDateParts => {
  const r = jdn - ETHIOPIAN_EPOCH;
  const year = Math.floor(r / 1461) * 4 + Math.floor((r % 1461) / 365) + 1;
  const month = Math.floor(((r % 1461) % 365) / 30) + 1;
  const day = (((r % 1461) % 365) % 30) + 1;
  return { year, month, day };
};

const ethiopianToJdn = ({ year, month, day }: EthiopianDateParts) => {
  return ETHIOPIAN_EPOCH + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
};

export const parseEthiopianDateString = (value: string): EthiopianDateParts | null => {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 13) return null;
  if (day < 1 || day > (month === 13 ? 6 : 30)) return null;

  return { year, month, day };
};

export const ethiopianToGregorianIso = (value: string): string | null => {
  const eth = parseEthiopianDateString(value);
  if (!eth) return null;
  const jdn = ethiopianToJdn(eth);
  const { year, month, day } = jdnToGregorian(jdn);
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

export const gregorianToEthiopian = (date: Date): EthiopianDateParts => {
  const jdn = toJdnFromGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return jdnToEthiopian(jdn);
};

export const formatEthiopianDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const eth = gregorianToEthiopian(d);
  return `${eth.year}-${String(eth.month).padStart(2, '0')}-${String(eth.day).padStart(2, '0')} ${ETHIOPIAN_MONTHS[eth.month - 1]}`;
};

export const formatEthiopianLabel = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const eth = gregorianToEthiopian(d);
  return `${eth.day} ${ETHIOPIAN_MONTHS[eth.month - 1]} ${eth.year}`;
};

export const isoToEthiopianLabel = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatEthiopianLabel(date);
};

export const validateEthiopianDateString = (value: string): boolean => {
  return parseEthiopianDateString(value) !== null;
};

export const gregorianToIso = (value: string): string | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear().toString().padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
