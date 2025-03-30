// 导入所有API模块
import * as user from './user'
import * as chat from './chat'
import * as map from './map'
import * as lostFound from './lostFound'
import * as im from './im'
import * as ai from './ai'
import * as product from './product'
import * as article from './article'
import * as common from './common'
import * as search from './search'
import * as upload from './upload'

// 创建API对象，便于统一管理
const api = {
  user,
  chat,
  map,
  im,
  lostFound,
  ai,
  product,
  article,
  common,
  search,
  upload
}

export default api