/**
 * API Type Definitions
 */

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  statusCode: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
  statusCode: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}
