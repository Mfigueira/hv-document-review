import { z } from 'zod';

export const SeveritySchema = z.enum(['critical', 'major', 'minor']);
export type Severity = z.infer<typeof SeveritySchema>;

export const ReviewStatusSchema = z.enum(['created', 'processing', 'on_review', 'submitted']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  page: z.number().int().positive(),
});
export type Issue = z.infer<typeof IssueSchema>;

export const DocumentPageSchema = z.object({
  page_num: z.number().int().positive(),
  height: z.number().positive(),
  width: z.number().positive(),
});
export type DocumentPage = z.infer<typeof DocumentPageSchema>;

export const ReviewDocumentSchema = z.object({
  pdf_url: z.string(),
  pages: z.array(DocumentPageSchema),
});
export type ReviewDocument = z.infer<typeof ReviewDocumentSchema>;

export const ReviewUserSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});
export type ReviewUser = z.infer<typeof ReviewUserSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  uploaded_at: z.string(),
  status: ReviewStatusSchema,
  version: z.number().int().nonnegative(),
  document: ReviewDocumentSchema,
  user: ReviewUserSchema,
  issues: z.array(IssueSchema),
});
export type Review = z.infer<typeof ReviewSchema>;
