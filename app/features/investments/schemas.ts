import { z } from 'zod';
import { baseRecordSchema } from '~/lib/schemas';

export const InvestmentSchema = baseRecordSchema.extend({
  units: z.string()
    .min(1, 'Valid units is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num >= 0;
    }, 'Valid units is required'),
});
