import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUnitWhere(unitId: string | null | undefined, alias = 'p') {
  if (!unitId || unitId === 'all') return { clause: '1=1', params: [] as (string | number)[] };
  return { clause: `${alias}.nama_unit = ?`, params: [unitId] };
}

export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
