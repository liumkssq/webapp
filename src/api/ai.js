import request from '@/utils/request'

/**
 * 分析商品图片
 * @param {object} data 请求数据
 * @param {string} data.imageUrl 图片URL
 * @param {string} data.category 商品分类
 * @returns {Promise} Promise对象
 */
export function analyzeProductImage(data) {
  return request({
    url: '/api/ai/analyze-image',
    method: 'post',
    data
  })
}

/**
 * 生成商品描述
 * @param {object} data 请求数据
 * @param {string} data.prompt 提示词
 * @param {string} data.category 商品分类
 * @param {string} data.condition 商品成色
 * @param {string} data.type 生成类型 (description/title/tags)
 * @returns {Promise} Promise对象
 */
export function generateProductContent(data) {
  return request({
    url: '/api/ai/generate-content',
    method: 'post',
    data
  })
}

/**
 * 生成标签
 * @param {object} data 请求数据
 * @param {string} data.description 商品描述
 * @param {string} data.category 商品分类
 * @returns {Promise} Promise对象
 */
export function generateTags(data) {
  return request({
    url: '/api/ai/generate-tags',
    method: 'post',
    data
  })
}

/**
 * 估算商品价格
 * @param {object} data 请求数据
 * @param {string} data.title 商品标题
 * @param {string} data.description 商品描述
 * @param {string} data.category 商品分类
 * @param {string} data.condition 商品成色
 * @param {Array<string>} data.imageUrls 图片URL数组
 * @returns {Promise} Promise对象
 */
export function estimatePrice(data) {
  return request({
    url: '/api/ai/estimate-price',
    method: 'post',
    data
  })
}

/**
 * 一键优化商品信息
 * @param {object} data 请求数据
 * @param {string} data.title 商品标题
 * @param {string} data.description 商品描述
 * @param {string} data.category 商品分类
 * @param {string} data.condition 商品成色
 * @param {number} data.price 商品价格
 * @param {Array<string>} data.imageUrls 图片URL数组
 * @returns {Promise} Promise对象
 */
export function optimizeProduct(data) {
  return request({
    url: '/api/ai/optimize-product',
    method: 'post',
    data
  })
}