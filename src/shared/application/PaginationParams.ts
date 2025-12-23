export interface PaginationParams {
  page: number; // Default: 1
  limit: number; // Default: 20, Max: 100
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
