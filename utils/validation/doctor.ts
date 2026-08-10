import { z } from "zod";

export const doctorOnboardingSchema = z.object({
  specialization: z.string().trim().min(2, "Enter a specialization."),
  qualifications: z.string().trim().min(2, "Enter your qualifications."),
  licenseNumber: z.string().trim().min(3, "Enter a valid license/registration number."),
  city: z.string().trim().min(2, "Enter a city."),
  bio: z.string().trim().max(1000, "Bio must be 1000 characters or fewer.").optional(),
  consultationFeeCents: z.coerce
    .number()
    .int()
    .positive("Consultation fee must be greater than zero."),
});

export const availabilitySlotSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type DoctorOnboarding = z.infer<typeof doctorOnboardingSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
