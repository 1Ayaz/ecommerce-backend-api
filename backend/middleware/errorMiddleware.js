const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorMiddleware = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
    } else {
        statusCode = err.statusCode || err.status || statusCode;
    }

    res.locals.errorMessage = err.message;

    const response = {
        success: false,
        error: {
            code: statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    };

    if (process.env.NODE_ENV === 'development') {
        logger.error(err);
    }

    res.status(statusCode).send(response);
};

module.exports = errorMiddleware;
