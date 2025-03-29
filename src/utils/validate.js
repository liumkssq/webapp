/**
 * 表单验证工具函数
 */

/**
 * 验证手机号
 * @param {String} value 手机号
 * @return {Boolean} 是否有效
 */
export const isValidPhone = (value) => {
  // 中国大陆手机号格式验证
  return /^1[3-9]\d{9}$/.test(value)
}

/**
 * 验证邮箱
 * @param {String} value 邮箱
 * @return {Boolean} 是否有效
 */
export const isValidEmail = (value) => {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value)
}

/**
 * 验证URL
 * @param {String} value URL
 * @return {Boolean} 是否有效
 */
export const isValidUrl = (value) => {
  try {
    new URL(value)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 验证身份证号（18位）
 * @param {String} value 身份证号
 * @return {Boolean} 是否有效
 */
export const isValidIdCard = (value) => {
  return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)
}

/**
 * 验证学号（假设学号为纯数字，长度8-12位）
 * @param {String} value 学号
 * @return {Boolean} 是否有效
 */
export const isValidStudentId = (value) => {
  return /^\d{8,12}$/.test(value)
}

/**
 * 验证密码强度
 * @param {String} value 密码
 * @param {Object} options 选项
 * @param {Number} options.minLength 最小长度，默认为8
 * @param {Boolean} options.requireLowercase 是否要求小写字母，默认为true
 * @param {Boolean} options.requireUppercase 是否要求大写字母，默认为true
 * @param {Boolean} options.requireNumber 是否要求数字，默认为true
 * @param {Boolean} options.requireSpecial 是否要求特殊字符，默认为true
 * @return {Object} 包含是否有效和强度级别的对象
 */
export const validatePassword = (value, options = {}) => {
  const { 
    minLength = 8, 
    requireLowercase = true,
    requireUppercase = true,
    requireNumber = true,
    requireSpecial = true
  } = options
  
  let strength = 0
  let errors = []
  
  // 检查长度
  if (value.length < minLength) {
    errors.push(`密码长度至少为${minLength}位`)
  } else {
    strength += 1
  }
  
  // 检查小写字母
  if (requireLowercase && !/[a-z]/.test(value)) {
    errors.push('密码需要包含小写字母')
  } else if (/[a-z]/.test(value)) {
    strength += 1
  }
  
  // 检查大写字母
  if (requireUppercase && !/[A-Z]/.test(value)) {
    errors.push('密码需要包含大写字母')
  } else if (/[A-Z]/.test(value)) {
    strength += 1
  }
  
  // 检查数字
  if (requireNumber && !/\d/.test(value)) {
    errors.push('密码需要包含数字')
  } else if (/\d/.test(value)) {
    strength += 1
  }
  
  // 检查特殊字符
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    errors.push('密码需要包含特殊字符')
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    strength += 1
  }
  
  // 额外强度检查
  if (value.length >= minLength + 4) {
    strength += 1
  }
  
  // 强度级别：0-弱；1-中等；2-强；3-非常强
  let level = 0
  if (strength >= 5) {
    level = 3 // 非常强
  } else if (strength >= 4) {
    level = 2 // 强
  } else if (strength >= 3) {
    level = 1 // 中等
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    level,
    strength
  }
}

/**
 * 验证表单字段
 * @param {Object} form 表单对象
 * @param {Object} rules 验证规则
 * @return {Object} 验证结果对象
 */
export const validateForm = (form, rules) => {
  const errors = {}
  let isValid = true
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field]
    const value = form[field]
    
    // 跳过没有规则的字段
    if (!fieldRules || !fieldRules.length) return
    
    const fieldErrors = []
    
    // 遍历字段的所有规则
    fieldRules.forEach(rule => {
      // 必填校验
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(rule.message || `${field}不能为空`)
        return
      }
      
      // 跳过空值的非必填校验
      if ((value === undefined || value === null || value === '') && !rule.required) {
        return
      }
      
      // 长度校验
      if (rule.min && value.length < rule.min) {
        fieldErrors.push(rule.message || `${field}长度不能小于${rule.min}`)
      }
      
      if (rule.max && value.length > rule.max) {
        fieldErrors.push(rule.message || `${field}长度不能大于${rule.max}`)
      }
      
      // 正则校验
      if (rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push(rule.message || `${field}格式不正确`)
      }
      
      // 自定义校验
      if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, form)
        if (result !== true && result !== undefined) {
          fieldErrors.push(typeof result === 'string' ? result : (rule.message || `${field}验证失败`))
        }
      }
      
      // 类型校验
      if (rule.type) {
        switch (rule.type) {
          case 'email':
            if (!isValidEmail(value)) {
              fieldErrors.push(rule.message || '邮箱格式不正确')
            }
            break
          case 'phone':
            if (!isValidPhone(value)) {
              fieldErrors.push(rule.message || '手机号格式不正确')
            }
            break
          case 'url':
            if (!isValidUrl(value)) {
              fieldErrors.push(rule.message || 'URL格式不正确')
            }
            break
          case 'idCard':
            if (!isValidIdCard(value)) {
              fieldErrors.push(rule.message || '身份证号格式不正确')
            }
            break
          case 'studentId':
            if (!isValidStudentId(value)) {
              fieldErrors.push(rule.message || '学号格式不正确')
            }
            break
        }
      }
    })
    
    // 如果有错误，则记录并标记整体验证为失败
    if (fieldErrors.length) {
      errors[field] = fieldErrors
      isValid = false
    }
  })
  
  return { isValid, errors }
}