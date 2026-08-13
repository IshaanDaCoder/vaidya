import { z } from "zod";

export const patientProfileSchema = z.object({
  dateOfBirth: z.coerce.date().max(new Date(), "Date of birth can't be in the future."),
  gender: z.string().trim().min(1, "Select a gender."),
  city: z.string().trim().min(2, "Enter a city."),
});

// height/weight are optional — a patient shouldn't be blocked from
// saving medications or history text just because they haven't measured
// themselves. BMI is never accepted as input; it's a generated column
// derived from height/weight in the database, so entering it here would
// let a client's number silently disagree with the one Postgres computes.
export const patientMedicalHistorySchema = z.object({
  medications: z.string().trim().max(2000).optional(),
  pastMedicalHistory: z.string().trim().max(2000).optional(),
  pastSurgicalHistory: z.string().trim().max(2000).optional(),
  familyHistory: z.string().trim().max(2000).optional(),
  smokingStatus: z.enum(["never", "former", "current"]).optional(),
  alcoholUse: z.enum(["never", "occasional", "regular"]).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
  weightKg: z.coerce.number().positive().max(500).optional(),
});

export type PatientProfile = z.infer<typeof patientProfileSchema>;
export type PatientMedicalHistory = z.infer<typeof patientMedicalHistorySchema>;
