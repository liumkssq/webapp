import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { setupMockDelay } from './utils/mock-helpers'

/**
 * 创建一个axios-mock-adapter实例，用于拦截请求
 * 与Mock.js的不同点在于，这个可以直接拦截axios请求
 */
let mockAdapter = null

/**
 * 初始化Mock拦截器
 * @param {object} options 配置选项
 * @returns {object} Mock适配器实例
 */
export const setupMockInterceptor = (options = {}) => {
  const {
    delay = 300,
    delayResponse = true,
    onNoMatch = 'passthrough'
  } = options

  // 设置Mock.js的全局延迟
  setupMockDelay(delay)

  // 如果已经有Mock适配器，先重置
  if (mockAdapter) {
    mockAdapter.restore()
  }

  // 创建新的Mock适配器
  mockAdapter = new MockAdapter(axios, {
    delayResponse: delayResponse ? delay : 0,
    onNoMatch
  })

  // 在控制台输出初始化信息
  console.log(`Mock拦截器已初始化，请求延迟: ${delay}ms`)

  return mockAdapter
}

/**
 * 获取Mock适配器实例
 * @returns {object|null} Mock适配器实例
 */
export const getMockAdapter = () => mockAdapter

/**
 * 重置Mock适配器
 */
export const resetMockAdapter = () => {
  if (mockAdapter) {
    mockAdapter.reset()
    console.log('Mock适配器已重置')
  }
}

/**
 * 恢复Mock适配器（停止拦截）
 */
export const restoreMockAdapter = () => {
  if (mockAdapter) {
    mockAdapter.restore()
    mockAdapter = null
    console.log('Mock适配器已移除')
  }
}

// 默认导出即初始化的Mock适配器
const initializedAdapter = setupMockInterceptor()
export default initializedAdapter

// 导出adapter实例，确保其已初始化
export { mockAdapter }