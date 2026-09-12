export interface FullMockScores {
  dsa: number;
  concepts: number;
  complexity: number;
  architecture: number;
}

export interface MockFeedback {
  strengths: string[];
  gaps: string[];
  actionItems: string[];
}

export interface FullMock {
  _id: string;
  date: string;
  scores: FullMockScores;
  notes?: string;
  feedback?: MockFeedback;
  topicIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MiniCheckItem {
  topicId?: string;
  topicName?: string;
  kind: "problem" | "definition";
  correct: boolean;
}

export interface MiniCheck {
  _id: string;
  date: string;
  items: MiniCheckItem[];
  createdAt: string;
  updatedAt: string;
}

export type TrendPoint =
  | { type: "miniCheck"; date: string; data: MiniCheck }
  | { type: "fullMock"; date: string; data: FullMock };
