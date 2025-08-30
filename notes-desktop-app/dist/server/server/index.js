"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServerRunning = exports.getServerInstance = exports.stopServer = exports.startServer = void 0;
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const NotesService_1 = require("./services/NotesService");
const FoldersService_1 = require("./services/FoldersService");
const middleware_1 = require("./middleware");
const routes_1 = require("./routes");
/**
 * 基于Koa2的本地笔记服务器
 * 提供轻量级、高性能的TypeScript REST API服务
 */
class KoaLocalServer {
    constructor() {
        this.server = null;
        this.app = new koa_1.default();
        this.router = new router_1.default();
        this.notesService = new NotesService_1.NotesService();
        this.foldersService = new FoldersService_1.FoldersService();
        this.initializeServer();
    }
    initializeServer() {
        // 错误处理中间件 - 放在最前面
        this.app.use(async (ctx, next) => {
            try {
                await next();
            }
            catch (err) {
                console.error('服务器错误:', err);
                ctx.status = err.status || 500;
                ctx.body = {
                    success: false,
                    error: ctx.status === 500 ? '内部服务器错误' : err.message,
                    message: err.message
                };
                ctx.app.emit('error', err, ctx);
            }
        });
        // 设置Koa中间件
        (0, middleware_1.setupKoaMiddleware)(this.app);
        // 设置路由
        (0, routes_1.setupKoaRoutes)(this.router, this.notesService, this.foldersService);
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
    async start(port) {
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
            this.server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    reject(new Error(`端口 ${port} 已被占用`));
                }
                else {
                    reject(err);
                }
            });
        });
    }
    async stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.server = null;
                    console.log('Koa笔记本地服务器已停止');
                    resolve();
                }
            });
        });
    }
    isRunning() {
        return this.server !== null;
    }
    getApp() {
        return this.app;
    }
    getNotesService() {
        return this.notesService;
    }
    getFoldersService() {
        return this.foldersService;
    }
}
// 单例模式
let serverInstance = null;
const startServer = async (port) => {
    if (serverInstance) {
        throw new Error('服务器已经在运行中');
    }
    serverInstance = new KoaLocalServer();
    await serverInstance.start(port);
};
exports.startServer = startServer;
const stopServer = async () => {
    if (serverInstance) {
        await serverInstance.stop();
        serverInstance = null;
    }
};
exports.stopServer = stopServer;
const getServerInstance = () => {
    return serverInstance;
};
exports.getServerInstance = getServerInstance;
const isServerRunning = () => {
    return serverInstance ? serverInstance.isRunning() : false;
};
exports.isServerRunning = isServerRunning;
// CommonJS兼容性导出
module.exports = {
    startServer: exports.startServer,
    stopServer: exports.stopServer,
    getServerInstance: exports.getServerInstance,
    isServerRunning: exports.isServerRunning,
    KoaLocalServer
};
