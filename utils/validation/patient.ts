import { z } from "zod";

export const patientProfileSchema = z.object({
  dateOfBirth: z.coerce.date().max(new Date(), "Date of birth can't be in the future."),
  gender: z.string().trim().min(1, "Select a gender."),
  city: z.string().trim().min(2, "Enter a city."),
});

export type PatientProfile = z.infer<typeof patientProfileSchema>;
