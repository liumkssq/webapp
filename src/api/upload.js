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

/**
 * 获取OSS预签名上传URL
 * @param {String} fileName 文件名
 * @param {String} fileType 文件类型（如image, video等）
 * @param {Number} fileSize 文件大小（可选）
 * @returns {Promise} Promise对象，返回预签名URL和文件路径
 */
export function getOssUploadUrl(fileName, fileType, fileSize) {
  return request({
    url: '/api/upload/oss/presigned-url',
    method: 'get',
    params: {
      fileName,
      fileType,
      fileSize
    }
  })
}

/**
 * 获取OSS表单上传签名
 * @param {String} fileType 文件类型（如image, video等）
 * @param {Number} fileSize 文件大小（可选）
 * @returns {Promise} Promise对象，返回签名信息
 */
export function getOssSignature(fileType, fileSize) {
  return request({
    url: '/api/upload/oss/signature',
    method: 'get',
    params: {
      fileType,
      fileSize
    }
  })
}

/**
 * 通过服务器代理上传文件到OSS
 * @param {FormData} formData 包含文件的FormData
 * @param {String} fileType 文件类型
 * @returns {Promise} Promise对象
 */
export function uploadToOssViaServer(formData, fileType) {
  formData.append('fileType', fileType)
  return request({
    url: '/api/upload/oss/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 直接上传文件到OSS（使用预签名URL）
 * @param {File} file 要上传的文件
 * @param {String} presignedUrl 预签名URL
 * @returns {Promise} Promise对象
 */
export function uploadToOss(file, presignedUrl) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', presignedUrl, true)
    
    // 添加必要的CORS和内容类型头
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('x-oss-object-acl', 'public-read')
    
    // 设置referrer策略
    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'no-referrer'
    document.head.appendChild(meta)
    
    try {
      xhr.onload = () => {
        // 恢复默认referrer策略
        document.head.removeChild(meta)
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true })
        } else {
          reject(new Error(`上传失败，状态码: ${xhr.status}, 响应: ${xhr.responseText}`))
        }
      }
      xhr.onerror = (e) => {
        // 恢复默认referrer策略
        document.head.removeChild(meta)
        console.error('上传出错:', e)
        reject(new Error('网络错误，上传失败'))
      }
      xhr.onabort = () => {
        // 恢复默认referrer策略
        document.head.removeChild(meta)
        reject(new Error('上传被取消'))
      }
      
      // 上传进度
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          console.log(`上传进度: ${percent}%`)
        }
      }
      
      xhr.send(file)
    } catch (e) {
      // 确保清理
      document.head.removeChild(meta)
      reject(e)
    }
  })
}

/**
 * 完整的图片上传流程：获取预签名URL并上传到OSS
 * @param {File} file 要上传的文件
 * @param {String} fileType 文件类型（image/avatar/video等）
 * @returns {Promise} Promise对象，返回文件URL和路径
 */
export async function uploadImageToOss(file, fileType = 'image') {
  try {
    // 获取预签名URL
    const response = await getOssUploadUrl(file.name, fileType, file.size)
    if (!response || !response.url) {
      throw new Error('获取上传URL失败')
    }
    
    // 检查URL中是否包含未替换的环境变量
    if (response.url.includes('${') || response.url.includes('$%7B')) {
      console.error('预签名URL包含未替换的环境变量:', response.url)
      throw new Error('服务器配置错误，请联系管理员')
    }
    
    // 上传文件到OSS，添加必要的CORS头
    await uploadToOss(file, response.url)
    
    // 确保返回的文件路径有效
    let fileUrl = response.filePath
    // 如果filePath是完整URL，直接使用；否则可能需要构建完整URL
    if (!fileUrl.startsWith('http')) {
      // 从response.url解析出OSS域名
      try {
        const urlObj = new URL(response.url)
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`
        fileUrl = `${baseUrl}/${fileUrl}`
      } catch (e) {
        console.warn('无法解析OSS域名，使用原始filePath:', e)
      }
    }
    
    return {
      url: fileUrl,
      success: true
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

/**
 * 使用表单上传方式上传到OSS（备选方案）
 * @param {File} file 要上传的文件
 * @param {String} fileType 文件类型（image/avatar/video等）
 * @returns {Promise} Promise对象，返回文件URL和路径
 */
export async function uploadImageToOssWithForm(file, fileType = 'image') {
  try {
    // 获取表单上传签名
    const response = await getOssSignature(fileType, file.size)
    if (!response || !response.policy) {
      throw new Error('获取表单上传签名失败')
    }
    
    // 创建FormData对象
    const formData = new FormData()
    
    // 生成唯一文件名
    const ext = file.name.substr(file.name.lastIndexOf('.'))
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 10)}${ext}`
    const key = `${response.dir}${fileName}`
    
    // 添加OSS需要的表单字段
    formData.append('key', key)
    formData.append('policy', response.policy)
    formData.append('OSSAccessKeyId', response.accessKeyId)
    formData.append('success_action_status', '200')
    formData.append('signature', response.signature)
    
    // 添加文件
    formData.append('file', file)
    
    // 发送表单上传请求
    const uploadResponse = await fetch(response.host, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`表单上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }
    
    // 构建文件URL
    const fileUrl = `${response.host}/${key}`
    
    return {
      url: fileUrl,
      success: true
    }
  } catch (error) {
    console.error('表单上传失败:', error)
    throw error
  }
}

/**
 * 智能上传图片（自动选择最佳上传方式）
 * @param {File} file 要上传的文件
 * @param {String} fileType 文件分类类型（product/lostfound/avatar等）
 * @returns {Promise} Promise对象，返回文件URL
 */
export async function smartUploadImage(file, fileType = 'image') {
  try {
    console.log(`开始上传${fileType}类型的文件:`, file.name);
    
    // 首先尝试使用服务器直传方式（最可靠）
    try {
      console.log('尝试使用服务器直传方式');
      const result = await uploadFileToServer(file, fileType);
      console.log('服务器直传成功:', result);
      return result;
    } catch (serverError) {
      console.warn('服务器直传失败，尝试其他方式:', serverError);
      
      // 然后尝试表单上传方式
      try {
        console.log('尝试使用表单上传方式');
        const result = await uploadImageToOssWithForm(file, fileType);
        console.log('表单上传成功:', result);
        return result;
      } catch (formError) {
        console.warn('表单上传失败，尝试预签名URL方式:', formError);
        
        // 最后尝试预签名URL方式
        const result = await uploadImageToOss(file, fileType);
        console.log('预签名URL上传成功:', result);
        return result;
      }
    }
  } catch (error) {
    console.error('所有上传方式均失败:', error);
    throw new Error(`上传失败: ${error.message}`);
  }
}

/**
 * 使用服务器作为代理上传文件（最可靠的方式）
 * @param {File} file 要上传的文件
 * @param {String} fileType 文件分类类型（product/lostfound/avatar等）
 * @returns {Promise} Promise对象，返回文件URL
 */
export async function uploadFileToServer(file, fileType = 'image') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  
  const response = await request({
    url: '/api/upload/oss/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  if (!response || !response.url) {
    throw new Error('服务器返回无效的上传结果');
  }
  
  return {
    url: response.url,
    filePath: response.filePath
  };
} 