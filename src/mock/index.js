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

// 引入模拟数据相关依赖
import Mock from 'mockjs'
import './utils'

// 设置模拟数据延迟时间
Mock.setup({
  timeout: '200-600'
})

// 是否启用模拟数据
// 在生产环境或连接到真实后端时设置为false
const enableMock = false

// 初始化模拟数据模块
const initMockModules = () => {
  if (!enableMock) return
  
  console.log('[Mock] 初始化模拟数据服务...')
  
  // 动态导入所有模拟数据模块
  const moduleFiles = require.context('./modules', true, /\.js$/)
  moduleFiles.keys().forEach(key => {
    try {
      const module = moduleFiles(key)
      console.log(`[Mock] 加载模块: ${key.replace(/^\.\//, '').replace(/\.js$/, '')}`)
    } catch (error) {
      console.error(`[Mock] 加载模块 ${key} 时出错:`, error)
    }
  })
  
  console.log('[Mock] 模拟数据服务初始化完成')
}

// 手动导入模块，确保正确加载
const importModules = () => {
  if (!enableMock) return
  
  // 用户相关
  require('./modules/user')
  
  // 商品相关
  require('./modules/product')
  
  // 文章相关
  require('./modules/article')
  
  // 失物招领相关
  require('./modules/lostFound')
  
  // 搜索相关
  require('./modules/search')
  
  // 上传相关
  require('./modules/upload')
  
  // 聊天相关
  require('./modules/chat')
  
  // 其他模块
  require('./modules/common')
  
  console.log('[Mock] 所有模块加载完成')
}

// 初始化
initMockModules()
importModules()

// 判断是否启用Mock
if (enableMock) {
  setupMockInterceptor() // 确保正确调用拦截器设置
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

export default Mock