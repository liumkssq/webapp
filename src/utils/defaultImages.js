/**
 * 默认图片资源处理工具
 * 提供默认图片和背景图，确保UI在资源缺失时仍能正常显示
 */

// 默认头像
export const DEFAULT_AVATAR = '/images/default-avatar.jpg';

// 默认背景图
export const DEFAULT_BACKGROUND = '/images/default-bg.jpg'; 

// 默认商品图
export const DEFAULT_PRODUCT_IMAGE = '/images/default-product.jpg';

// 默认文章封面图
export const DEFAULT_ARTICLE_COVER = '/images/default-article-cover.jpg';

// 备用网络图片（当本地图片不可用时）
export const FALLBACK_IMAGES = {
  avatar: 'https://img01.yzcdn.cn/vant/cat.jpeg',
  background: 'https://img01.yzcdn.cn/vant/cat-2.jpeg',
  product: 'https://img01.yzcdn.cn/vant/ipad.jpeg',
  article: 'https://img01.yzcdn.cn/vant/apple-1.jpg'
};

/**
 * 获取安全的图片URL，如果源图片无效则使用默认图片
 * @param {string} src 源图片URL
 * @param {string} fallback 默认图片URL
 * @returns {string} 安全的图片URL
 */
export const getSafeImageUrl = (src, fallback = DEFAULT_AVATAR) => {
  if (!src || src === '' || src === 'null' || src === 'undefined') {
    // 使用备用网络图片确保显示
    if (fallback === DEFAULT_AVATAR) return FALLBACK_IMAGES.avatar;
    if (fallback === DEFAULT_BACKGROUND) return FALLBACK_IMAGES.background;
    if (fallback === DEFAULT_PRODUCT_IMAGE) return FALLBACK_IMAGES.product;
    if (fallback === DEFAULT_ARTICLE_COVER) return FALLBACK_IMAGES.article;
    return fallback;
  }
  
  // 如果是相对路径但没有以/开头，添加/
  if (!src.startsWith('http') && !src.startsWith('/')) {
    return '/' + src;
  }
  
  return src;
};

/**
 * 处理图片加载错误，使用默认图片代替
 * @param {Event} event 错误事件
 * @param {string} fallback 默认图片URL
 */
export const handleImageError = (event, fallback = DEFAULT_AVATAR) => {
  // 使用备用网络图片确保显示
  if (fallback === DEFAULT_AVATAR) {
    event.target.src = FALLBACK_IMAGES.avatar;
  } else if (fallback === DEFAULT_BACKGROUND) {
    event.target.src = FALLBACK_IMAGES.background;
  } else if (fallback === DEFAULT_PRODUCT_IMAGE) {
    event.target.src = FALLBACK_IMAGES.product;
  } else if (fallback === DEFAULT_ARTICLE_COVER) {
    event.target.src = FALLBACK_IMAGES.article;
  } else {
    event.target.src = fallback;
  }
};

export default {
  DEFAULT_AVATAR,
  DEFAULT_BACKGROUND,
  DEFAULT_PRODUCT_IMAGE,
  DEFAULT_ARTICLE_COVER,
  FALLBACK_IMAGES,
  getSafeImageUrl,
  handleImageError
}; 