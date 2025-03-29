import request from '@/utils/request'

/**
 * 地址解析（地址转坐标）
 * @param {string} address 地址
 * @param {string} city 城市名
 * @returns {Promise} Promise对象
 */
export function geocode(address, city = '') {
  return request({
    url: '/api/map/geocode',
    method: 'get',
    params: {
      address,
      city
    }
  })
}

/**
 * 逆地址解析（坐标转地址）
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @returns {Promise} Promise对象
 */
export function reverseGeocode(lng, lat) {
  return request({
    url: '/api/map/reverse-geocode',
    method: 'get',
    params: {
      lng,
      lat
    }
  })
}

/**
 * 获取位置建议
 * @param {string} keyword 关键词
 * @param {string} region 区域
 * @returns {Promise} Promise对象
 */
export function getLocationSuggestions(keyword, region = '全国') {
  return request({
    url: '/api/map/suggestions',
    method: 'get',
    params: {
      keyword,
      region
    }
  })
}

/**
 * 地点检索
 * @param {string} keyword 关键词
 * @param {string} region 区域
 * @param {number} page 页码
 * @param {number} pageSize 每页数量
 * @returns {Promise} Promise对象
 */
export function searchPlaces(keyword, region = '全国', page = 1, pageSize = 10) {
  return request({
    url: '/api/map/search',
    method: 'get',
    params: {
      keyword,
      region,
      page,
      pageSize
    }
  })
}

/**
 * 周边检索
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @param {string} keyword 关键词
 * @param {number} radius 半径
 * @param {number} page 页码
 * @param {number} pageSize 每页数量
 * @returns {Promise} Promise对象
 */
export function searchNearby(lng, lat, keyword, radius = 1000, page = 1, pageSize = 10) {
  return request({
    url: '/api/map/nearby',
    method: 'get',
    params: {
      lng,
      lat,
      keyword,
      radius,
      page,
      pageSize
    }
  })
}

// 获取周边POI信息
export function getNearbyPOI(lat, lng, radius = 1000, keyword = '', type = '') {
  return request.get('/map/nearby', { lat, lng, radius, keyword, type })
}

// 获取两点间距离
export function getDistance(fromLat, fromLng, toLat, toLng) {
  return request.get('/map/distance', { fromLat, fromLng, toLat, toLng })
}

// 保存用户常用地址
export function saveUserAddress(data) {
  return request.post('/map/save-address', data)
}

// 获取用户常用地址列表
export function getUserAddresses() {
  return request.get('/map/user-addresses')
}

// 删除用户常用地址
export function deleteUserAddress(addressId) {
  return request.delete(`/map/address/${addressId}`)
}