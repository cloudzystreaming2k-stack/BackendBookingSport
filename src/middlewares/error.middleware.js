/**
 * Middleware xử lý lỗi 404 (Không tìm thấy route)
 */
export const notFound = (req, res, next) => {
   const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
   res.status(404);
   next(error);
};

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 */
export const errorHandler = (err, req, res, next) => {
   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
   res.status(statusCode);
   res.json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
   });
};
