// 导入所有API模块
import * as user from './user'

// 创建API对象，便于统一管理
const api = {
  user,
  
  // 占位API，后续实现
  product: {
    getProductList: (params) => Promise.resolve({
      code: 200,
      message: '获取成功',
      data: {
        total: 20,
        page: 1,
        pageSize: 10,
        list: Array(params?.limit || 10).fill().map((_, i) => ({
          id: i + 1,
          title: `测试商品 ${i + 1}`,
          description: '这是一个测试商品描述，用于展示产品信息。',
          price: Math.floor(Math.random() * 1000) + 10,
          imageUrl: `https://picsum.photos/id/${20 + i}/300/200`,
          createdAt: '2023-04-15 14:30',
          seller: {
            id: 1,
            nickname: '测试用户'
          }
        }))
      }
    })
  },
  
  lostFound: {
    getLostFoundList: (params) => Promise.resolve({
      code: 200,
      message: '获取成功',
      data: {
        total: 15,
        page: 1,
        pageSize: 10,
        list: Array(params?.limit || 10).fill().map((_, i) => ({
          id: i + 1,
          type: i % 2 === 0 ? 'lost' : 'found',
          title: i % 2 === 0 ? `寻找失物：钱包${i + 1}` : `招领启事：钥匙${i + 1}`,
          description: '物品描述信息，包含物品特征、丢失/拾取时间等详细信息。',
          location: i % 2 === 0 ? '图书馆三楼' : '学生食堂',
          time: '2023-04-15 14:30',
          imageUrl: i % 3 === 0 ? `https://picsum.photos/id/${50 + i}/300/200` : null,
          status: ['open', 'pending', 'closed'][i % 3],
          publisher: {
            id: 1,
            nickname: '测试用户'
          }
        }))
      }
    })
  },
  
  article: {
    getArticleList: (params) => Promise.resolve({
      code: 200,
      message: '获取成功',
      data: {
        total: 25,
        page: 1,
        pageSize: 10,
        list: Array(params?.limit || 10).fill().map((_, i) => ({
          id: i + 1,
          title: `校园话题：测试文章 ${i + 1}`,
          brief: '这是一篇测试文章的简要描述，包含了文章的主要内容和观点。',
          coverImage: i % 2 === 0 ? `https://picsum.photos/id/${70 + i}/300/200` : null,
          createdAt: '2023-04-15 14:30',
          viewCount: Math.floor(Math.random() * 5000) + 100,
          likeCount: Math.floor(Math.random() * 500) + 10,
          commentCount: Math.floor(Math.random() * 100) + 5,
          author: {
            id: 1,
            nickname: '测试用户'
          }
        }))
      }
    })
  }
}

export default api