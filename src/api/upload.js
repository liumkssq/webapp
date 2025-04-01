import request from '@/utils/request'

/**
 * 上传单个图片文件
 * @param {File} file 图片文件对象
 * @returns {Promise<string>} 上传成功后的图片URL
 */
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: 'http://localhost:8888/api/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(response => {
    if (response.code === 200 && response.data) {
      return response.data.url || response.data
    }
    return Promise.reject(new Error(response.message || '图片上传失败'))
  })
}

/**
 * 上传多个图片
 * @param {FormData} formData 包含多个图片的FormData
 * @param {Object} options 上传选项
 * @returns {Promise<Object>} Promise对象
 */
export function uploadImages(formData, options = {}) {
  return request({
    url: 'http://localhost:8888/api/upload/images',
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
 * @returns {Promise<Object>} Promise对象
 */
export function uploadFile(formData, options = {}) {
  return request({
    url: 'http://localhost:8888/api/upload/file',
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
 * @returns {Promise<Object>} Promise对象
 */
export function uploadAvatar(formData) {
  return request({
    url: 'http://localhost:8888/api/upload/avatar',
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
 * @returns {Promise<Object>} Promise对象
 */
export function uploadImageByUrl(data) {
  return request({
    url: 'http://localhost:8888/api/upload/url',
    method: 'post',
    data
  })
}

/**
 * 上传多个图片文件
 * @param {File[]} files 图片文件对象数组
 * @returns {Promise<string[]>} 上传成功后的图片URL数组
 */
export function uploadMultipleImages(files) {
  const formData = new FormData()
  
  files.forEach((file, index) => {
    formData.append('files', file)
  })
  
  return request({
    url: 'http://localhost:8888/api/upload/images',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(response => {
    if (response.code === 200 && response.data) {
      return Array.isArray(response.data) ? response.data : [response.data]
    }
    return Promise.reject(new Error(response.message || '多图片上传失败'))
  })
}

/**
 * 从URL上传图片
 * @param {string} imageUrl 图片URL
 * @returns {Promise<string>} 上传成功后的新图片URL
 */
export function uploadImageFromUrl(imageUrl) {
  return request({
    url: 'http://localhost:8888/api/upload/url',
    method: 'post',
    data: { url: imageUrl }
  }).then(response => {
    if (response.code === 200 && response.data) {
      return response.data.url || response.data
    }
    return Promise.reject(new Error(response.message || '图片URL上传失败'))
  })
}

export default {
  uploadImage,
  uploadImages,
  uploadMultipleImages,
  uploadFile,
  uploadAvatar,
  uploadImageByUrl,
  uploadImageFromUrl
} 