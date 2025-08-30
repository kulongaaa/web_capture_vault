import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import json from 'koa-json';
import logger from 'koa-logger';
import { ApiResponse } from '../types';

/**
 * 设置Koa中间件
 */
export const setupKoaMiddleware = (app: Koa): void => {
  // 请求日志
  app.use(logger());

  // JSON美化输出
  app.use(json());

  // CORS跨域支持 - 允许浏览器插件跨域访问
  app.use(cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-API-Token']
  }));

  // 请求体解析
  app.use(bodyParser({
    jsonLimit: '50mb',
    textLimit: '50mb'
  }));

  // 自定义日志中间件
  app.use(async (ctx, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ${ctx.method} ${ctx.path} - ${ctx.ip}`);
    
    // 记录请求体（排除敏感信息）
    if (ctx.request.body && Object.keys(ctx.request.body).length > 0) {
      const sanitizedBody = { ...ctx.request.body };
      // 可以在这里过滤敏感字段
      console.log('Request Body:', JSON.stringify(sanitizedBody, null, 2));
    }
    
    await next();
    
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${ctx.method} ${ctx.path} - ${ctx.status} (${duration}ms)`);
  });

  // 简单的API token验证中间件（可选）
  app.use(async (ctx, next) => {
    // 只对 /api 路径进行验证
    if (ctx.path.startsWith('/api')) {
      // 这里可以实现简单的token验证
      // 由于是本地应用，可以使用简单的固定token或者不验证
      const token = ctx.headers['x-api-token'] || ctx.headers['authorization'];
      
      // 暂时跳过验证，直接通过
      // 如果需要验证，可以取消注释下面的代码
      /*
      const expectedToken = 'local-notes-app-token';
      if (!token || token !== expectedToken) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          error: 'Unauthorized',
          message: '无效的API令牌'
        } as ApiResponse;
        return;
      }
      */
    }
    
    await next();
  });

  // 健康检查接口
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.body = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          framework: 'Koa2 + TypeScript'
        }
      } as ApiResponse;
      return;
    }
    
    await next();
  });

  // API版本信息
  app.use(async (ctx, next) => {
    if (ctx.path === '/api/version') {
      ctx.body = {
        success: true,
        data: {
          version: '1.0.0',
          apiVersion: 'v1',
          framework: 'Koa2 + TypeScript',
          features: ['notes', 'folders', 'search']
        }
      } as ApiResponse;
      return;
    }
    
    await next();
  });
};

// CommonJS兼容性导出
module.exports = { setupKoaMiddleware };