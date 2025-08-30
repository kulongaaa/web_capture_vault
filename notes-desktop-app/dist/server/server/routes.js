"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupKoaRoutes = void 0;
/**
 * 设置所有的Koa API路由
 */
const setupKoaRoutes = (router, notesService, foldersService) => {
    // === 笔记相关路由 ===
    // 获取笔记列表
    router.get('/api/notes', async (ctx) => {
        try {
            const query = {
                page: parseInt(ctx.query.page) || 1,
                limit: parseInt(ctx.query.limit) || 20,
                folderId: ctx.query.folderId,
                search: ctx.query.search,
                tags: ctx.query.tags ? ctx.query.tags.split(',') : undefined
            };
            const result = await notesService.getNotes(query);
            ctx.body = {
                success: true,
                data: result
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '获取笔记列表失败',
                message: error.message
            };
        }
    });
    // 获取单个笔记
    router.get('/api/notes/:id', async (ctx) => {
        try {
            const note = await notesService.getNote(ctx.params.id);
            if (!note) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: '笔记不存在',
                    message: `ID为 ${ctx.params.id} 的笔记未找到`
                };
                return;
            }
            ctx.body = {
                success: true,
                data: note
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '获取笔记失败',
                message: error.message
            };
        }
    });
    // 创建新笔记
    router.post('/api/notes', async (ctx) => {
        try {
            const noteData = ctx.request.body;
            // 验证必填字段
            if (!noteData.title || !noteData.content) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: '缺少必填字段',
                    message: '标题和内容不能为空'
                };
                return;
            }
            const note = await notesService.createNote(noteData);
            ctx.status = 201;
            ctx.body = {
                success: true,
                data: note,
                message: '笔记创建成功'
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '创建笔记失败',
                message: error.message
            };
        }
    });
    // 更新笔记
    router.put('/api/notes/:id', async (ctx) => {
        try {
            const updateData = ctx.request.body;
            const note = await notesService.updateNote(ctx.params.id, updateData);
            if (!note) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: '笔记不存在',
                    message: `ID为 ${ctx.params.id} 的笔记未找到`
                };
                return;
            }
            ctx.body = {
                success: true,
                data: note,
                message: '笔记更新成功'
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '更新笔记失败',
                message: error.message
            };
        }
    });
    // 删除笔记
    router.delete('/api/notes/:id', async (ctx) => {
        try {
            const success = await notesService.deleteNote(ctx.params.id);
            if (!success) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: '笔记不存在',
                    message: `ID为 ${ctx.params.id} 的笔记未找到`
                };
                return;
            }
            ctx.body = {
                success: true,
                message: '笔记删除成功'
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '删除笔记失败',
                message: error.message
            };
        }
    });
    // === 文件夹相关路由 ===
    // 获取文件夹树结构
    router.get('/api/folders', async (ctx) => {
        try {
            const folders = await foldersService.getFolders();
            ctx.body = {
                success: true,
                data: folders
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '获取文件夹失败',
                message: error.message
            };
        }
    });
    // 创建文件夹
    router.post('/api/folders', async (ctx) => {
        try {
            const folderData = ctx.request.body;
            if (!folderData.name) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: '缺少必填字段',
                    message: '文件夹名称不能为空'
                };
                return;
            }
            const folder = await foldersService.createFolder(folderData);
            ctx.status = 201;
            ctx.body = {
                success: true,
                data: folder,
                message: '文件夹创建成功'
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '创建文件夹失败',
                message: error.message
            };
        }
    });
    // 删除文件夹
    router.delete('/api/folders/:id', async (ctx) => {
        try {
            const success = await foldersService.deleteFolder(ctx.params.id);
            if (!success) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    error: '文件夹不存在',
                    message: `ID为 ${ctx.params.id} 的文件夹未找到`
                };
                return;
            }
            ctx.body = {
                success: true,
                message: '文件夹删除成功'
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '删除文件夹失败',
                message: error.message
            };
        }
    });
    // === 搜索相关路由 ===
    // 全文搜索
    router.get('/api/search', async (ctx) => {
        try {
            const query = ctx.query.q;
            if (!query) {
                ctx.status = 400;
                ctx.body = {
                    success: false,
                    error: '缺少搜索参数',
                    message: '搜索关键词不能为空'
                };
                return;
            }
            const results = await notesService.searchNotes(query);
            ctx.body = {
                success: true,
                data: results
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '搜索失败',
                message: error.message
            };
        }
    });
    // === 统计相关路由 ===
    // 获取统计信息
    router.get('/api/stats', async (ctx) => {
        try {
            const stats = await notesService.getStats();
            ctx.body = {
                success: true,
                data: stats
            };
        }
        catch (error) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: '获取统计信息失败',
                message: error.message
            };
        }
    });
};
exports.setupKoaRoutes = setupKoaRoutes;
// CommonJS兼容性导出
module.exports = { setupKoaRoutes: exports.setupKoaRoutes };
