import Mock from 'mockjs'

// 导入模块
import './modules/im'
import './modules/user'  // 添加用户模块

// 配置 Mock.js 请求延时
Mock.setup({
  timeout: '200-600'
})

// 输出 Mock 初始化信息
console.log('Mock 服务已初始化成功')

export default Mock