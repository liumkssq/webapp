import request from '@/utils/request'

/**
 * 上传单个图片
 * @param {FormData} formData 包含图片的FormData
 * @param {Object} options 上传选项
 * @returns {Promise} Promise对象
 */
export function uploadImage(formData, options = {}) {
  return request({
    url: '/api/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  })
}

/**
 * 上传多个图片
 * @param {FormData} formData 包含多个图片的FormData
 * @param {Object} options 上传选项
 * @returns {Promise} Promise对象
 */
export function uploadImages(formData, options = {}) {
  return request({
    url: '/api/upload/images',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  })
}

/**
 * 上传文件
 * @param {FormData} formData 包含文件的FormData
 * @param {Object} options 上传选项
 * @returns {Promise} Promise对象
 */
export function uploadFile(formData, options = {}) {
  return request({
    url: '/api/upload/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  })
}

/**
 * 上传头像
 * @param {FormData} formData 包含头像的FormData
 * @returns {Promise} Promise对象
 */
export function uploadAvatar(formData) {
  return request({
    url: '/api/upload/avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 通过URL上传图片
 * @param {Object} data 包含图片URL的数据
 * @returns {Promise} Promise对象
 */
export function uploadImageByUrl(data) {
  return request({
    url: '/api/upload/url',
    method: 'post',
    data
  })
} 