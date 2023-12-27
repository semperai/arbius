export type File = {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}


export type Model = {
  id: string;
  object: string;
  owned_by: string;
  permission: string[];
}

export type Delete = {
  id: string;
  object: string;
  deleted: boolean;
}
