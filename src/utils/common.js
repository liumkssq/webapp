/**
 * 通用工具函数库
 */

/**
 * 生成随机ID
 * @param {number} length - ID长度，默认为16
 * @returns {string} 随机ID
 */
export function getRandomId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date);
  
  const formatObj = {
    YYYY: d.getFullYear(),
    MM: (d.getMonth() + 1).toString().padStart(2, '0'),
    DD: d.getDate().toString().padStart(2, '0'),
    HH: d.getHours().toString().padStart(2, '0'),
    mm: d.getMinutes().toString().padStart(2, '0'),
    ss: d.getSeconds().toString().padStart(2, '0')
  };
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatObj[match]);
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  
  return function(...args) {
    if (timer) clearTimeout(timer);
    
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

/**
 * 深拷贝对象
 * @param {Object} obj - 需要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * 千分位格式化数字
 * @param {number} num - 需要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 获取URL参数
 * @param {string} name - 参数名称
 * @param {string} url - URL，默认为当前页面URL
 * @returns {string|null} 参数值
 */
export function getUrlParam(name, url = window.location.href) {
  const reg = new RegExp('[?&]' + name + '=([^&#]*)', 'i');
  const match = url.match(reg);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 需要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * 截断文本
 * @param {string} text - 文本内容
 * @param {number} length - 最大长度
 * @param {string} suffix - 后缀，默认为'...'
 * @returns {string} 截断后的文本
 */
export function truncateText(text, length, suffix = '...') {
  if (!text || text.length <= length) {
    return text;
  }
  return text.substring(0, length) + suffix;
}