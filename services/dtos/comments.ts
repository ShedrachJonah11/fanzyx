import type { CreatorMini } from "./posts";

export interface CommentOut {
  id: string;
  author: CreatorMini;
  body: string;
  parentId: string | null;
  createdAt: string;
}

export interface CommentCreateIn {
  body: string;
  parentId?: string;
}
