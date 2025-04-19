// 项目配置文件

// API基础URL
export const API_BASE_URL = '/api';

// 文件上传路径
export const UPLOAD_URL = '/api/upload';

// 应用标题
export const APP_TITLE = 'Campus Exchange';

// WebSocket配置
export const WS_CONFIG = {
  // WebSocket基础URL
  BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:10090/ws',
  // 心跳间隔(毫秒)
  HEARTBEAT_INTERVAL: 30000,
  // 重连间隔(毫秒)
  RECONNECT_INTERVAL: 3000,
  // 最大重连次数
  MAX_RECONNECT_ATTEMPTS: 5,
}; 