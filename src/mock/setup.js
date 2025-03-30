import Mock from 'mockjs'

// 导入模块
import './modules/im'
import './modules/user'  // 添加用户模块

// 设置更宽松的超时时间，避免请求超时问题
Mock.setup({
  timeout: '100-1000'
})

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

export default Mock