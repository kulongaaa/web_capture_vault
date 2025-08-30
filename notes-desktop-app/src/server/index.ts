import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import json from 'koa-json';
import logger from 'koa-logger';
import { Server } from 'http';
import { NotesService } from './services/NotesService';
import { FoldersService } from './services/FoldersService';
import { setupKoaMiddleware } from './middleware';
import { setupKoaRoutes } from './routes';

/**
 * 基于Koa2的本地笔记服务器
 * 提供轻量级、高性能的TypeScript REST API服务
 */
class KoaLocalServer {
  private app: Koa;
  private router: Router;
  private server: Server | null = null;
  private notesService: NotesService;
  private foldersService: FoldersService;

  constructor() {
    this.app = new Koa();
    this.router = new Router();
    this.notesService = new NotesService();
    this.foldersService = new FoldersService();
    this.initializeServer();
  }

  private initializeServer(): void {
    // 错误处理中间件 - 放在最前面
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        console.error('服务器错误:', err);
        ctx.status = (err as any).status || 500;
        ctx.body = {
          success: false,
          error: ctx.status === 500 ? '内部服务器错误' : (err as any).message,
          message: (err as any).message
        };
        ctx.app.emit('error', err, ctx);
      }
    });

    // 设置Koa中间件
    setupKoaMiddleware(this.app);

    // 设置路由
    setupKoaRoutes(this.router, this.notesService, this.foldersService);

    // 应用路由
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    // 404 处理
    this.app.use(async (ctx) => {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: '接口不存在',
        message: `路径 ${ctx.path} 未找到`
      };
    });
  }

  public async start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error('服务器已经启动'));
        return;
      }

      this.server = this.app.listen(port, '127.0.0.1', () => {
        console.log(`Koa笔记本地服务器启动成功，监听端口: ${port}`);
        console.log(`API地址: http://127.0.0.1:${port}`);
        console.log(`框架: Koa2 + TypeScript`);
        resolve();
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`端口 ${port} 已被占用`));
        } else {
          reject(err);
        }
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          console.log('Koa笔记本地服务器已停止');
          resolve();
        }
      });
    });
  }

  public isRunning(): boolean {
    return this.server !== null;
  }

  public getApp(): Koa {
    return this.app;
  }

  public getNotesService(): NotesService {
    return this.notesService;
  }

  public getFoldersService(): FoldersService {
    return this.foldersService;
  }
}

// 单例模式
let serverInstance: KoaLocalServer | null = null;

export const startServer = async (port: number): Promise<void> => {
  if (serverInstance) {
    throw new Error('服务器已经在运行中');
  }
  
  serverInstance = new KoaLocalServer();
  await serverInstance.start(port);
};

export const stopServer = async (): Promise<void> => {
  if (serverInstance) {
    await serverInstance.stop();
    serverInstance = null;
  }
};

export const getServerInstance = (): KoaLocalServer | null => {
  return serverInstance;
};

export const isServerRunning = (): boolean => {
  return serverInstance ? serverInstance.isRunning() : false;
};

// CommonJS兼容性导出
module.exports = {
  startServer,
  stopServer,
  getServerInstance,
  isServerRunning,
  KoaLocalServer
};