import { z } from "zod";

const num = z.coerce.number().positive().optional().catch(undefined);
export const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  code: z.string().optional().catch(undefined),
  purpose: z.enum(["venda", "locacao"]).optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  city: z.string().optional().catch(undefined),
  neighborhood: z.string().optional().catch(undefined),
  bedrooms: num,
  bathrooms: num,
  parking: num,
  minPrice: num,
  maxPrice: num,
  minArea: num,
  maxArea: num,
  sort: z.enum(["recentes", "menor", "maior"]).optional().catch(undefined),
  page: num,
});
