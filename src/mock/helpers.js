/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 生成分页数据
 * @param {Array} list 原始数据列表
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @returns {Object} 分页后的数据对象
 */
export function generateListPageData(list, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageList = list.slice(startIndex, endIndex);
  const total = list.length;
  
  return {
    list: pageList,
    page,
    limit,
    total,
    pageCount: Math.ceil(total / limit),
    hasMore: endIndex < total
  };
} 