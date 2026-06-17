export type Severity = 'critical' | 'major' | 'minor';

export type ReviewStatus = 'created' | 'processing' | 'on_review' | 'submitted';

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  page: number; // 1-based page where the issue appears
}

export interface DocumentPage {
  page_num: number; // 1-based
  height: number; // points
  width: number; // points
}

export interface ReviewDocument {
  pdf_url: string; // replaced with local static file
  pages: DocumentPage[];
}

export interface ReviewUser {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Review {
  id: string;
  name: string; // file name, e.g. "Annual Compliance Report..."
  uploaded_at: string; // ISO datetime of latest version upload
  status: ReviewStatus;
  version: number;
  document: ReviewDocument;
  user: ReviewUser;
  issues: Issue[];
}
