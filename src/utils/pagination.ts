/**
 * Pagination Utilities
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export function calculatePagination(options: PaginationOptions): Omit<PaginationResult, 'total' | 'totalPages' | 'hasNextPage' | 'hasPreviousPage'> {
  const maxLimit = options.maxLimit || 100;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationResult {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
