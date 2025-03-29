import Mock from 'mockjs'
import userMock from './modules/user'
import chatMock from './modules/chat'
import lostFoundMock from './modules/lostFound'

// 配置Mock
Mock.setup({
  timeout: '200-600'
})

// 注册Mock API
const registerMock = mockModules => {
  for (const [api, response] of Object.entries(mockModules)) {
    const [method, url] = api.split(' ')
    
    // 构建正则表达式以匹配动态路由参数（如:id）
    let urlRegex = url
    
    if (url.includes(':')) {
      urlRegex = new RegExp(url.replace(/:([^/]+)/g, '([^/]+)'))
    }
    
    Mock.mock(urlRegex, method.toLowerCase(), response)
  }
}

// 注册API模块
registerMock(userMock)
registerMock(chatMock)
registerMock(lostFoundMock)

// 暴露Mock对象，方便后续可能的扩展
export default Mock