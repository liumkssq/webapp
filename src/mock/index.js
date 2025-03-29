import Mock from 'mockjs'
import userMock from './modules/user'
import chatMock from './modules/chat'
import lostFoundMock from './modules/lostFound'
import mapMock from './modules/map'
import articleMock from './modules/article'
import productMock from './modules/product'

// 配置Mock
Mock.setup({
  timeout: '200-600'
})

// 启用控制台日志
console.log('[Mock] 初始化Mock系统')

// 注册Mock API
const registerMock = mockModules => {
  for (const [api, response] of Object.entries(mockModules)) {
    const [method, url] = api.split(' ')
    
    // 构建正则表达式以匹配动态路由参数（如:id）
    let urlRegex = url
    
    if (url.includes(':')) {
      urlRegex = new RegExp(url.replace(/:([^/]+)/g, '([^/]+)'))
    }
    
    console.log(`[Mock] 注册API: ${method} ${url}`)
    Mock.mock(urlRegex, method.toLowerCase(), response)
  }
}

// 注册API模块
registerMock(userMock)
registerMock(chatMock)
registerMock(lostFoundMock)
registerMock(mapMock)
registerMock(articleMock)
registerMock(productMock)

console.log('[Mock] Mock系统初始化完成')
export default Mock