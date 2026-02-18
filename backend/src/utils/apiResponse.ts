/**
 * Standardized API response helpers
 */

/**
 * Success response
 */
export function successResponse<T>(data: T, statusCode = 200) {
  return {
    success: true,
    data,
  };
}

/**
 * Error response
 */
export function errorResponse(error: string, statusCode = 500) {
  return {
    success: false,
    error,
  };
}

/**
 * Paginated response
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
