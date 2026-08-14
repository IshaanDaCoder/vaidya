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

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Enter a time as HH:MM.");

export const dayHoursSchema = z
  .object({
    isActive: z.boolean(),
    startTime: timeString,
    endTime: timeString,
  })
  .refine((data) => !data.isActive || data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export const weeklyHoursSchema = z.object({
  slotDurationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Slot length must be at least 5 minutes.")
    .max(240, "Slot length must be 240 minutes or fewer."),
  days: z.array(dayHoursSchema).length(7),
});

export type DoctorOnboarding = z.infer<typeof doctorOnboardingSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type WeeklyHours = z.infer<typeof weeklyHoursSchema>;
