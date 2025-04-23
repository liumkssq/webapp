// 项目配置文件

// 配置文件
const isDev = import.meta.env.DEV

// API 配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8000' : '/api'),
  
  // 超时时间
  TIMEOUT: 10000,
  
  // 请求头
  HEADERS: {
    'Content-Type': 'application/json'
  }
}

// WebSocket 配置
export const WS_CONFIG = {
  // WebSocket基础URL
  BASE_URL: import.meta.env.VITE_WS_URL || (isDev ? 'ws://127.0.0.1:10090/ws' : `ws://${window.location.host}/ws`),
  
  // 重连间隔(毫秒)
  RECONNECT_INTERVAL: 3000,
  
  // 最大重连次数
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // 心跳间隔(毫秒)
  HEARTBEAT_INTERVAL: 15000
}

// 文件上传配置
export const UPLOAD_CONFIG = {
  // 文件上传URL
  UPLOAD_URL: `${API_CONFIG.BASE_URL}/upload`,
  
  // 最大文件大小 (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // 允许的文件类型
  ALLOWED_FILE_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALL: ['*/*']
  }
}

// 消息配置
export const MESSAGE_CONFIG = {
  // 消息类型
  TYPE: {
    TEXT: 'text',
    IMAGE: 'image',
    VOICE: 'voice',
    VIDEO: 'video',
    FILE: 'file',
    LOCATION: 'location',
    SYSTEM: 'system'
  },
  
  // 每页加载的消息数量
  PAGE_SIZE: 20
}

// 路由配置
export const ROUTE_CONFIG = {
  // 无需认证的路由
  NO_AUTH_ROUTES: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/about'
  ],
  
  // 默认路由
  DEFAULT_ROUTE: '/im/conversations',
  
  // 登录路由
  LOGIN_ROUTE: '/login'
}

// 存储配置
export const STORAGE_CONFIG = {
  // Token存储键名
  TOKEN_KEY: 'token',
  
  // 用户信息存储键名
  USER_INFO_KEY: 'userInfo'
}

// 导出默认配置
export default {
  API_CONFIG,
  WS_CONFIG,
  UPLOAD_CONFIG,
  MESSAGE_CONFIG,
  ROUTE_CONFIG,
  STORAGE_CONFIG
} 