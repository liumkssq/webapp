/**
 * 重定向工具函数
 * 统一处理重定向URL参数，避免双问号和过度编码问题
 */

/**
 * 处理重定向URL，确保正确格式
 * @param {string} path - 要重定向到的路径
 * @returns {string} - 格式化后的路径
 */
export const formatRedirectPath = (path) => {
  if (!path) return '';
  // 移除前导斜杠，防止在URL中出现双斜杠
  return path.replace(/^\//, '');
};

/**
 * 生成带重定向参数的登录URL
 * @param {string} redirectPath - 重定向目标路径
 * @returns {string} - 完整的登录URL，包含重定向参数
 */
export const getLoginRedirectUrl = (redirectPath) => {
  if (!redirectPath) return '/login';
  
  // 防止redirectPath已经包含问号，可能导致双问号问题
  if (redirectPath.includes('?')) {
    // 如果路径包含查询参数，需要特殊处理
    const [path, query] = redirectPath.split('?');
    const formattedPath = formatRedirectPath(path);
    // 在编码时包含查询部分
    return `/login?redirect=${formattedPath}?${query}`;
  }
  
  const formattedPath = formatRedirectPath(redirectPath);
  return `/login?redirect=${formattedPath}`;
};

/**
 * 从URL参数中解析重定向路径
 * @param {Object} routeQuery - 路由查询对象(route.query)
 * @returns {string} - 解码后的重定向路径
 */
export const parseRedirectPath = (routeQuery) => {
  // 处理参数为空的情况
  if (!routeQuery || !routeQuery.redirect) return '/mine';
  
  // 获取重定向路径
  let redirectUrl = routeQuery.redirect;
  console.log('原始重定向参数:', redirectUrl);
  
  // 解码URL，处理可能的多次编码情况
  try {
    redirectUrl = decodeURIComponent(redirectUrl);
    
    // 处理多次编码的情况
    while (redirectUrl.includes('%2F')) {
      redirectUrl = decodeURIComponent(redirectUrl);
    }
  } catch (e) {
    console.error('解码重定向URL出错:', e);
    // 解码失败，使用原始值
  }
  
  // 处理特殊情况：双问号导致的空值或无效值
  if (!redirectUrl || redirectUrl === '?' || redirectUrl === 'undefined') {
    console.warn('检测到无效的重定向参数');
    return '/mine';
  }
  
  // 确保路径以斜杠开头
  if (!redirectUrl.startsWith('/')) {
    redirectUrl = '/' + redirectUrl;
  }
  
  // 移除路径中可能存在的多余问号
  redirectUrl = redirectUrl.replace(/\?+/g, '?');
  
  console.log('处理后的重定向路径:', redirectUrl);
  return redirectUrl;
}; 