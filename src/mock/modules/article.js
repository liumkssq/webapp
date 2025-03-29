import Mock from 'mockjs'
import { getQueryParams } from '@/utils/index'

// 文章列表数据
const generateArticleList = (count) => {
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(Mock.mock({
      id: '@id',
      title: '@ctitle(10, 20)',
      content: '@cparagraph(10, 20)',
      'images|0-4': ['@image("200x200", "#4A7BF7", "#fff", "Image")'],
      'tags|1-3': ['@ctitle(2, 4)'],
      likes: '@integer(0, 1000)',
      comments: '@integer(0, 100)',
      views: '@integer(100, 10000)',
      isLiked: '@boolean',
      publishTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
      author: {
        id: '@id',
        nickname: '@cname',
        avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")',
        isFollowing: '@boolean'
      }
    }))
  }
  return list
}

// 定义接口对象
const article = {
  // 获取文章列表
  'GET /api/article/list': (options) => {
    const params = getQueryParams(options.url)
    const page = parseInt(params.page) || 1
    const size = parseInt(params.size) || 10
    
    const list = generateArticleList(size)
    
    return {
      code: 200,
      data: {
        list,
        total: 100,
        page,
        size
      },
      message: '获取文章列表成功'
    }
  },

  // 获取文章详情
  'GET /api/article/\\d+$': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)/)[1]
    
    const article = Mock.mock({
      id,
      title: '@ctitle(10, 20)',
      content: '@cparagraph(20, 30)',
      'images|1-6': ['@image("400x300", "#4A7BF7", "#fff", "Image")'],
      'tags|2-4': ['@ctitle(2, 4)'],
      likes: '@integer(0, 1000)',
      comments: '@integer(0, 100)',
      views: '@integer(100, 10000)',
      isLiked: '@boolean',
      publishTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
      author: {
        id: '@id',
        nickname: '@cname',
        avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")',
        isFollowing: '@boolean'
      }
    })
    
    return {
      code: 200,
      data: article,
      message: '获取文章详情成功'
    }
  },

  // 发布文章
  'POST /api/article/publish': (options) => {
    const postData = JSON.parse(options.body)
    
    if (!postData.title || !postData.content) {
      return {
        code: 400,
        message: '标题和内容不能为空'
      }
    }
    
    return {
      code: 200,
      data: {
        id: Mock.Random.id(),
        ...postData,
        publishTime: Mock.Random.datetime(),
        views: 0,
        likes: 0,
        comments: 0
      },
      message: '文章发布成功'
    }
  },

  // 更新文章
  'PUT /api/article/\\d+$': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)/)[1]
    const updateData = JSON.parse(options.body)
    
    if (!updateData.title || !updateData.content) {
      return {
        code: 400,
        message: '标题和内容不能为空'
      }
    }
    
    return {
      code: 200,
      data: {
        id,
        ...updateData,
        updateTime: Mock.Random.datetime()
      },
      message: '文章更新成功'
    }
  },

  // 删除文章
  'DELETE /api/article/\\d+$': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)/)[1]
    
    return {
      code: 200,
      message: '文章删除成功'
    }
  },

  // 点赞文章
  'POST /api/article/\\d+/like': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/like/)[1]
    
    return {
      code: 200,
      data: {
        id,
        isLiked: true
      },
      message: '点赞成功'
    }
  },

  // 取消点赞文章
  'POST /api/article/\\d+/unlike': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/unlike/)[1]
    
    return {
      code: 200,
      data: {
        id,
        isLiked: false
      },
      message: '取消点赞成功'
    }
  },

  // 收藏文章
  'POST /api/article/\\d+/collect': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/collect/)[1]
    
    return {
      code: 200,
      data: {
        id,
        isCollected: true
      },
      message: '收藏成功'
    }
  },

  // 取消收藏文章
  'POST /api/article/\\d+/uncollect': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/uncollect/)[1]
    
    return {
      code: 200,
      data: {
        id,
        isCollected: false
      },
      message: '取消收藏成功'
    }
  },

  // 获取文章评论列表
  'GET /api/article/\\d+/comments': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/comments/)[1]
    const params = getQueryParams(options.url)
    const page = parseInt(params.page) || 1
    const size = parseInt(params.size) || 10
    
    const generateComments = (count) => {
      const comments = []
      for (let i = 0; i < count; i++) {
        comments.push(Mock.mock({
          id: '@id',
          content: '@cparagraph(1, 3)',
          time: '@datetime("yyyy-MM-dd HH:mm:ss")',
          isLiked: '@boolean',
          author: {
            id: '@id',
            nickname: '@cname',
            avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")'
          },
          'replies|0-5': [
            {
              id: '@id',
              content: '@cparagraph(1, 2)',
              time: '@datetime("yyyy-MM-dd HH:mm:ss")',
              author: {
                id: '@id',
                nickname: '@cname',
                avatar: '@image("100x100", "#4A7BF7", "#fff", "Avatar")'
              },
              replyTo: {
                id: '@id',
                nickname: '@cname'
              }
            }
          ]
        }))
      }
      return comments
    }
    
    return {
      code: 200,
      data: {
        list: generateComments(size),
        total: 50,
        page,
        size
      },
      message: '获取评论列表成功'
    }
  },

  // 发表评论
  'POST /api/article/\\d+/comment': (options) => {
    const id = options.url.match(/\/api\/article\/(\d+)\/comment/)[1]
    const commentData = JSON.parse(options.body)
    
    if (!commentData.content) {
      return {
        code: 400,
        message: '评论内容不能为空'
      }
    }
    
    return {
      code: 200,
      data: {
        id: Mock.Random.id(),
        content: commentData.content,
        time: Mock.Random.datetime(),
        isLiked: false,
        author: {
          id: Mock.Random.id(),
          nickname: '当前用户',
          avatar: 'https://via.placeholder.com/100'
        },
        replies: []
      },
      message: '评论发表成功'
    }
  }
}

export default article