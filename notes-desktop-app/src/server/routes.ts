import Router from '@koa/router';
import { Context } from 'koa';
import { NotesService } from './services/NotesService';
import { FoldersService } from './services/FoldersService';
import { ApiResponse, CreateNoteRequest, UpdateNoteRequest, CreateFolderRequest, NotesQuery } from '../types';

/**
 * 设置所有的Koa API路由
 */
export const setupKoaRoutes = (
  router: Router,
  notesService: NotesService,
  foldersService: FoldersService
): void => {
  
  // === 笔记相关路由 ===

  // 获取笔记列表
  router.get('/api/notes', async (ctx: Context) => {
    try {
      const query: NotesQuery = {
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 20,
        folderId: ctx.query.folderId as string,
        search: ctx.query.search as string,
        tags: ctx.query.tags ? (ctx.query.tags as string).split(',') : undefined
      };

      const result = await notesService.getNotes(query);
      
      ctx.body = {
        success: true,
        data: result
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取笔记列表失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 获取单个笔记
  router.get('/api/notes/:id', async (ctx: Context) => {
    try {
      const note = await notesService.getNote(ctx.params.id);
      
      if (!note) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '笔记不存在',
          message: `ID为 ${ctx.params.id} 的笔记未找到`
        } as ApiResponse;
        return;
      }

      ctx.body = {
        success: true,
        data: note
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取笔记失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 创建新笔记
  router.post('/api/notes', async (ctx: Context) => {
    try {
      const noteData: CreateNoteRequest = ctx.request.body as CreateNoteRequest;
      
      // 验证必填字段
      if (!noteData.title || !noteData.content) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '缺少必填字段',
          message: '标题和内容不能为空'
        } as ApiResponse;
        return;
      }

      const note = await notesService.createNote(noteData);
      
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: note,
        message: '笔记创建成功'
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '创建笔记失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 更新笔记
  router.put('/api/notes/:id', async (ctx: Context) => {
    try {
      const updateData: UpdateNoteRequest = ctx.request.body as UpdateNoteRequest;
      const note = await notesService.updateNote(ctx.params.id, updateData);
      
      if (!note) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '笔记不存在',
          message: `ID为 ${ctx.params.id} 的笔记未找到`
        } as ApiResponse;
        return;
      }

      ctx.body = {
        success: true,
        data: note,
        message: '笔记更新成功'
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '更新笔记失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 删除笔记
  router.delete('/api/notes/:id', async (ctx: Context) => {
    try {
      const success = await notesService.deleteNote(ctx.params.id);
      
      if (!success) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '笔记不存在',
          message: `ID为 ${ctx.params.id} 的笔记未找到`
        } as ApiResponse;
        return;
      }

      ctx.body = {
        success: true,
        message: '笔记删除成功'
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '删除笔记失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // === 文件夹相关路由 ===

  // 获取文件夹树结构
  router.get('/api/folders', async (ctx: Context) => {
    try {
      const folders = await foldersService.getFolders();
      
      ctx.body = {
        success: true,
        data: folders
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取文件夹失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 创建文件夹
  router.post('/api/folders', async (ctx: Context) => {
    try {
      const folderData: CreateFolderRequest = ctx.request.body as CreateFolderRequest;
      
      if (!folderData.name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '缺少必填字段',
          message: '文件夹名称不能为空'
        } as ApiResponse;
        return;
      }

      const folder = await foldersService.createFolder(folderData);
      
      ctx.status = 201;
      ctx.body = {
        success: true,
        data: folder,
        message: '文件夹创建成功'
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '创建文件夹失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // 删除文件夹
  router.delete('/api/folders/:id', async (ctx: Context) => {
    try {
      const success = await foldersService.deleteFolder(ctx.params.id);
      
      if (!success) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: '文件夹不存在',
          message: `ID为 ${ctx.params.id} 的文件夹未找到`
        } as ApiResponse;
        return;
      }

      ctx.body = {
        success: true,
        message: '文件夹删除成功'
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '删除文件夹失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // === 搜索相关路由 ===

  // 全文搜索
  router.get('/api/search', async (ctx: Context) => {
    try {
      const query = ctx.query.q as string;
      
      if (!query) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '缺少搜索参数',
          message: '搜索关键词不能为空'
        } as ApiResponse;
        return;
      }

      const results = await notesService.searchNotes(query);
      
      ctx.body = {
        success: true,
        data: results
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '搜索失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });

  // === 统计相关路由 ===

  // 获取统计信息
  router.get('/api/stats', async (ctx: Context) => {
    try {
      const stats = await notesService.getStats();
      
      ctx.body = {
        success: true,
        data: stats
      } as ApiResponse;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取统计信息失败',
        message: (error as any).message
      } as ApiResponse;
    }
  });
};

// CommonJS兼容性导出
module.exports = { setupKoaRoutes };