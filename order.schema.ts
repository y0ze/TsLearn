import { z } from "zod";

export const AddressSchema = z.object({
  street: z.string(),
  number: z.number(),
  city: z.string(),
  postalCode: z.string(),
});

export const OrderedProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const OrderSchema = z.object({
  name: z.string(),
  delivery: AddressSchema,
  products: z.array(OrderedProductSchema),
});

export type Address = z.infer<typeof AddressSchema>;
export type OrderedProduct = z.infer<typeof OrderedProductSchema>;
export type Order = z.infer<typeof OrderSchema>;
