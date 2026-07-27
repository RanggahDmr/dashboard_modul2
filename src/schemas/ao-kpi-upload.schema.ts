import { z } from 'zod';

export const aoKpiUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required and must be a valid File object.' }),
  periode: z.string().min(1, 'Periode is required.'),
  nama_unit: z.string().min(1, 'Nama unit is required.'),
});
