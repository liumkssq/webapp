// 新的 Mock 数据入口文件
import './setup'
import mockAdapterInstance, { setupMockInterceptor, resetMockAdapter, restoreMockAdapter, getMockAdapter } from './interceptor'

// 导入各个模块的mock数据
import './modules/user'
// import './modules/auth' // 移除不存在的模块导入
import './modules/article'
import './modules/product'
import './modules/search'
import './modules/common'
import './modules/im'
import './modules/map'
import './modules/lostFound'

// 判断是否启用Mock
const enableMock = true

if (enableMock) {
  console.log('Mock 服务已启用，所有API请求将被拦截')
} else {
  // 如果不启用Mock，则恢复拦截器
  restoreMockAdapter()
  console.log('Mock 服务已禁用，使用真实API请求')
}

// 获取mockAdapter实例
const mockAdapter = getMockAdapter()

// 导出 Mock 相关函数
export {
  mockAdapter,
  mockAdapterInstance,
  setupMockInterceptor,
  resetMockAdapter,
  restoreMockAdapter,
  getMockAdapter
}

// 为了向后兼容
import { setupMockServer } from './setup'
export { setupMockServer }