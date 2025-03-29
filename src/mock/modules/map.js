import Mock from 'mockjs'
import { delay, getUrlParams } from '../utils'

const Random = Mock.Random

// 生成建议位置
const generateSuggestions = (keyword, count = 10) => {
  return Array(count).fill().map((_, i) => ({
    id: `poi_${i + 1}`,
    name: `${keyword}${Random.ctitle(2, 8)}`,
    address: Random.county() + Random.csentence(5, 10),
    city: Random.city(),
    district: Random.county(),
    latitude: Random.float(39.5, 40.5, 6, 6),
    longitude: Random.float(116, 117, 6, 6)
  }))
}

// 生成POI信息
const generatePOIs = (count = 10) => {
  const types = ['餐饮', '购物', '教育', '交通', '住宿', '娱乐', '医疗', '生活服务']
  
  return Array(count).fill().map((_, i) => ({
    id: `poi_${i + 1}`,
    name: Random.ctitle(3, 8),
    address: Random.county() + Random.csentence(5, 15),
    type: Random.pick(types),
    city: Random.city(),
    district: Random.county(),
    latitude: Random.float(39.5, 40.5, 6, 6),
    longitude: Random.float(116, 117, 6, 6),
    distance: Random.integer(50, 2000),
    tag: Random.pick(['学校', '商场', '公园', '医院', '车站', '餐厅', '超市']),
    rating: Random.float(3, 5, 1, 1),
    phone: `1${Random.pick(['3', '5', '7', '8', '9'])}${Random.string('number', 9)}`
  }))
}

// 地图模块
const mapMock = {
  // 地址解析（地址转坐标）
  'GET /api/map/geocode': config => {
    const { address, city } = getUrlParams(config.url)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        results: [
          {
            address: address,
            city: city || Random.city(),
            district: Random.county(),
            street: Random.cword(2, 4) + '路',
            streetNumber: Random.integer(1, 100) + '号',
            latitude: Random.float(39.5, 40.5, 6, 6),
            longitude: Random.float(116, 117, 6, 6),
            precise: Random.integer(0, 1),
            confidence: Random.integer(50, 100),
            level: Random.pick(['道路', '门址', '知名POI'])
          }
        ]
      }
    }
  },
  
  // 逆地址解析（坐标转地址）
  'GET /api/map/reverse-geocode': config => {
    const { lng, lat } = getUrlParams(config.url)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        address: `${Random.province()}${Random.city()}${Random.county()}${Random.cword(2, 4)}路${Random.integer(1, 100)}号`,
        formatted_address: `${Random.province()}${Random.city()}${Random.county()}${Random.cword(2, 4)}路${Random.integer(1, 100)}号`,
        business: Random.cword(2, 5),
        city: Random.city(),
        city_code: Random.integer(100, 500),
        district: Random.county(),
        province: Random.province(),
        street: Random.cword(2, 4) + '路',
        street_number: Random.integer(1, 100) + '号',
        country: '中国',
        country_code: 0,
        adcode: Random.integer(100000, 999999),
        location: {
          lng: parseFloat(lng) || Random.float(116, 117, 6, 6),
          lat: parseFloat(lat) || Random.float(39.5, 40.5, 6, 6)
        },
        pois: generatePOIs(5),
        sematic_description: `${Random.cword(2, 5)}附近${Random.integer(10, 500)}米`
      }
    }
  },
  
  // 获取位置建议
  'GET /api/map/suggestions': config => {
    const { keyword, region } = getUrlParams(config.url)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        query: keyword,
        suggestions: generateSuggestions(keyword, Random.integer(3, 10))
      }
    }
  },
  
  // 地点检索
  'GET /api/map/search': config => {
    const { keyword, region, page = 1, pageSize = 10 } = getUrlParams(config.url)
    
    const total = Random.integer(10, 100)
    const pois = generatePOIs(Math.min(total, parseInt(pageSize)))
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pageCount: Math.ceil(total / parseInt(pageSize)),
        keyword,
        region,
        pois
      }
    }
  },
  
  // 周边检索
  'GET /api/map/nearby': config => {
    const { lng, lat, keyword, radius = 1000, page = 1, pageSize = 10 } = getUrlParams(config.url)
    
    const total = Random.integer(5, 30)
    const pois = generatePOIs(Math.min(total, parseInt(pageSize)))
    
    // 计算实际距离
    pois.forEach(poi => {
      poi.distance = Random.integer(50, parseInt(radius))
    })
    
    // 按距离排序
    pois.sort((a, b) => a.distance - b.distance)
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pageCount: Math.ceil(total / parseInt(pageSize)),
        center: {
          lng: parseFloat(lng) || Random.float(116, 117, 6, 6),
          lat: parseFloat(lat) || Random.float(39.5, 40.5, 6, 6)
        },
        radius: parseInt(radius),
        keyword,
        pois
      }
    }
  }
}

export default mapMock 