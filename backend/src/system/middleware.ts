import { Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

/**
 * Request, response 를 로깅하는 미들웨어
 */
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {

    const start = new Date().getTime();

    const {
      ip, originalUrl: url, method, headers, body,
    } = req;

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseHeaders = res.getHeaders();

      const elapsed = new Date().getTime() - start;

      this.logger.debug(JSON.stringify({
        request: {
          headers, body
        }
      }));

      this.logger.log(JSON.stringify({
        request: {
          ip, method, url
        },
        elapsed: elapsed + 'ms',
        response: {
          status: statusCode,
          headers: responseHeaders,
          contentLength,
        }
      }));
    });

    next();
  }
}
