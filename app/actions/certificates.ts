"use server";

import { createClient } from "@/lib/supabase/server";

export interface CertificateRecord {
  id: string;
  student_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
}

export interface IssueCertificateResult {
  certificate: CertificateRecord | null;
  error?: string;
}

/**
 * Server action to issue a certificate if course completion is 100%.
 * Calls the SECURITY DEFINER RPC `issue_certificate` in Supabase.
 * Idempotent: returns existing certificate if one was already issued.
 */
export async function maybeIssueCertificate(
  studentId: string,
  courseId: string
): Promise<IssueCertificateResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("issue_certificate", {
      p_student: studentId,
      p_course: courseId,
    });

    if (error) {
      return {
        certificate: null,
        error: error.message,
      };
    }

    return {
      certificate: data as CertificateRecord,
    };
  } catch (err) {
    return {
      certificate: null,
      error: err instanceof Error ? err.message : "حدث خطأ أثناء إصدار الشهادة",
    };
  }
}
