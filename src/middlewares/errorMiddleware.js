export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const payload = {
        message: err.message || "Server error",
    };

    if (process.env.NODE_ENV !== "production") {
        payload.stack = err.stack;
    }

    res.status(statusCode).json(payload);
};
