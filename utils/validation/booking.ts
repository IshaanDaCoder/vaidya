import { z } from "zod";

export const bookConsultationSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor."),
  slotId: z.string().uuid("Invalid slot."),
});

export const reviewSchema = z.object({
  consultationId: z.string().uuid("Invalid consultation."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000, "Review must be 1000 characters or fewer.").optional(),
});

export type BookConsultation = z.infer<typeof bookConsultationSchema>;
export type Review = z.infer<typeof reviewSchema>;
