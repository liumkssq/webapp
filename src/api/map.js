import request from './request'

// 地图相关接口
export default {
  // 获取位置建议（输入提示）
  getLocationSuggestions(keyword, region = '全国') {
    return request.get('/map/suggestions', { keyword, region })
  },
  
  // 地理编码（地址转坐标）
  geocode(address, city = '') {
    return request.get('/map/geocode', { address, city })
  },
  
  // 逆地理编码（坐标转地址）
  reverseGeocode(lat, lng) {
    return request.get('/map/reverse-geocode', { lat, lng })
  },
  
  // 获取周边POI信息
  getNearbyPOI(lat, lng, radius = 1000, keyword = '', type = '') {
    return request.get('/map/nearby', { lat, lng, radius, keyword, type })
  },
  
  // 获取两点间距离
  getDistance(fromLat, fromLng, toLat, toLng) {
    return request.get('/map/distance', { fromLat, fromLng, toLat, toLng })
  },
  
  // 保存用户常用地址
  saveUserAddress(data) {
    return request.post('/map/save-address', data)
  },
  
  // 获取用户常用地址列表
  getUserAddresses() {
    return request.get('/map/user-addresses')
  },
  
  // 删除用户常用地址
  deleteUserAddress(addressId) {
    return request.delete(`/map/address/${addressId}`)
  }
}