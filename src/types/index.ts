export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  createdAt: Date | any; // Firestore Timestamp
  updatedAt: Date | any;
}

export interface MarkdownDocument {
  id: string;
  projectId: string;
  title: string;
  content: string; // The raw markdown
  status: 'draft' | 'review' | 'approved';
  order: number; // For custom sorting
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface ClientProfile {
  email: string;
  name: string;
  projects: string[]; // List of project IDs
}