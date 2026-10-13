/**
 * Standard API response utility for consistent client-server contracts.
 */
export const responseUtil = {
  /**
   * Send a successful response.
   */
  success: (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  /**
   * Send an error response.
   */
  error: (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const payload = {
      success: false,
      message,
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  },
};
