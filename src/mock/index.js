import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { delay, randomInt } from './utils'

// 导入所有模块
import userMock from './modules/user'
import productMock from './modules/product'

// 创建 mock 实例
const mock = new MockAdapter(axios, {
  delayResponse: 300, // 默认延迟响应时间
  onNoMatch: 'passthrough' // 未匹配到的请求将被传递给实际的 axios 适配器
})

/**
 * 模拟接口响应
 * @param {Object} config 请求配置
 * @param {number} status HTTP状态码
 * @param {Object} response 响应数据
 */
const respond = (config, status, response) => {
  // 随机延迟 300-1000ms，模拟网络延迟
  const delayTime = randomInt(300, 1000)
  
  return delay(delayTime).then(() => {
    return [status, response]
  })
}

/**
 * 注册 mock 接口
 * @param {Object} mockModule 包含多个 API mock 方法的模块
 */
const registerMockApis = (mockModule) => {
  Object.keys(mockModule).forEach(key => {
    const [method, url] = key.split(' ')
    const handler = mockModule[key]
    
    // 转换 URL 中的参数格式
    const mockUrl = url.replace(/:([^/]+)/g, (match, param) => `(\\d+|\\w+)`)
    
    // 根据 HTTP 方法注册不同的 mock 处理函数
    switch (method) {
      case 'GET':
        mock.onGet(new RegExp(mockUrl)).reply(config => {
          const response = handler(config)
          return respond(config, response.code === 200 ? 200 : response.code, response)
        })
        break
      case 'POST':
        mock.onPost(new RegExp(mockUrl)).reply(config => {
          const response = handler(config)
          return respond(config, response.code === 200 ? 200 : response.code, response)
        })
        break
      case 'PUT':
        mock.onPut(new RegExp(mockUrl)).reply(config => {
          const response = handler(config)
          return respond(config, response.code === 200 ? 200 : response.code, response)
        })
        break
      case 'DELETE':
        mock.onDelete(new RegExp(mockUrl)).reply(config => {
          const response = handler(config)
          return respond(config, response.code === 200 ? 200 : response.code, response)
        })
        break
      default:
        break
    }
  })
}

// 注册所有 mock 模块
const registerAllMocks = () => {
  registerMockApis(userMock)
  registerMockApis(productMock)
  // 在这里添加更多模块的注册
  
  console.log('[API Mock] 接口模拟服务已启动')
}

export default {
  /**
   * 启动 mock 服务
   */
  start() {
    registerAllMocks()
  },
  
  /**
   * 停止 mock 服务
   */
  stop() {
    mock.restore()
    console.log('[API Mock] 接口模拟服务已停止')
  }
};