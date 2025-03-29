import Mock from 'mockjs'
import user from './modules/user'
import article from './modules/article'
import product from './modules/product'
import lostFound from './modules/lostFound'
import chat from './modules/chat'

// 设置全局延时，模拟网络请求时间
Mock.setup({
  timeout: '200-600'
})

// 注册所有mock服务
const mockModules = [
  user,
  article,
  product,
  lostFound,
  chat
]

// 遍历模块并注册mock接口
mockModules.forEach(mockModule => {
  Object.keys(mockModule).forEach(key => {
    const [method, url] = key.split(' ')
    if (method && url) {
      Mock.mock(new RegExp(url), method.toLowerCase(), mockModule[key])
    }
  })
})

console.log('Mock数据服务已启动')

export default Mock