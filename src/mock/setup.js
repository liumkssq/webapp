import Mock from 'mockjs'

// 导入所有模块
import './modules/im'
import './modules/user'
import './modules/lostFound'
import './modules/product'
import './modules/article'
import './modules/chat'
import './modules/map'
import './modules/ai'
import './modules/search'
import './modules/common'

// 设置更宽松的超时时间，避免请求超时问题
Mock.setup({
  timeout: '100-1000'
})

// 使用通用工具函数
import { getUrlParams, getRequestBody, delay, setupMockDelay } from './utils/mock-helpers'

// 重新导出这些工具函数
export { getUrlParams, getRequestBody, delay, setupMockDelay }

// 输出 Mock 初始化信息
console.log('Mock 服务已初始化成功')

// 安全地输出已注册的接口
const logMockedApis = () => {
  if (!Mock._mocked) {
    console.log('未找到已注册的Mock接口');
    return;
  }
  
  // Mock.js在不同版本中_mocked的结构可能不同
  try {
    if (Array.isArray(Mock._mocked)) {
      console.log('已注册的接口:', Mock._mocked.map(item => item.url || item.rurl).join(', '));
    } else if (typeof Mock._mocked === 'object') {
      // 如果是对象，尝试获取键
      console.log('已注册的接口:', Object.keys(Mock._mocked).join(', '));
    } else {
      console.log('Mock._mocked存在但不是预期的结构:', typeof Mock._mocked);
    }
  } catch (error) {
    console.log('输出Mock接口信息时出错:', error.message);
  }
};

logMockedApis();

// 设置Mock服务器函数
export const setupMockServer = () => {
  console.log('Mock服务器已设置，API请求将被拦截')
  return {
    isMockEnabled: true
  }
}

export default Mock