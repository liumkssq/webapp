import Mock from 'mockjs'
import { getUrlParams, getRequestBody, delay } from '../utils'

// 生成商品分类
const productCategories = [
  { id: 1, name: '电子数码', icon: 'smartphone', count: 358 },
  { id: 2, name: '学习用品', icon: 'book', count: 275 },
  { id: 3, name: '生活日用', icon: 'shopping-bag', count: 198 },
  { id: 4, name: '服装鞋帽', icon: 'shirt', count: 165 },
  { id: 5, name: '美妆护肤', icon: 'droplet', count: 112 },
  { id: 6, name: '运动户外', icon: 'activity', count: 97 },
  { id: 7, name: '图书音像', icon: 'book-open', count: 89 },
  { id: 8, name: '食品饮料', icon: 'coffee', count: 76 }
]

// 生成商品标签
const productTags = [
  '二手', '9成新', '全新', '自用闲置', '正品保障', '便宜出', 
  '急售', '可议价', '包邮', '当面交易', '线上交易', '特价',
  '限量版', '保修内', '送配件', '送礼品'
]

// 生成商品
const generateProducts = (count = 100) => {
  return Mock.mock({
    [`list|${count}`]: [{
      'id|+1': 1,
      'title': '@ctitle(10, 20)',
      'description': '@cparagraph(3, 7)',
      'brief': '@csentence(10, 20)',
      'price|1-10000.1-2': 100,
      'originalPrice|+1-15000.1-2': 200,
      'categoryId|1-8': 1,
      'category': function() {
        return productCategories.find(c => c.id === this.categoryId).name;
      },
      'tags': function() {
        const tagCount = Mock.Random.integer(0, 5);
        const result = [];
        for (let i = 0; i < tagCount; i++) {
          const tag = productTags[Mock.Random.integer(0, productTags.length - 1)];
          if (!result.includes(tag)) {
            result.push(tag);
          }
        }
        return result;
      },
      'condition|1': ['全新', '几乎全新', '轻微使用痕迹', '明显使用痕迹', '重度使用痕迹'],
      'stock|1-100': 1,
      'salesCount|0-1000': 0,
      'viewCount|50-10000': 100,
      'likeCount|0-200': 0,
      'isLiked|1-2': true,
      'status|1': ['on_sale', 'sold_out', 'removed'],
      'images': function() {
        const count = Mock.Random.integer(1, 8);
        const images = [];
        for (let i = 0; i < count; i++) {
          images.push(Mock.Random.image('400x400', Mock.Random.color(), '#FFF', 'Product'));
        }
        return images;
      },
      'thumbnails': function() {
        const count = this.images.length;
        const thumbnails = [];
        for (let i = 0; i < count; i++) {
          thumbnails.push(Mock.Random.image('100x100', Mock.Random.color(), '#FFF', 'Thumb'));
        }
        return thumbnails;
      },
      'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'updatedAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
      'location': '@city',
      'seller': {
        'id|1-100': 1,
        'username': '@word(5, 10)',
        'nickname': '@cname',
        'avatar': '@image("80x80", "#ffcc33", "#FFF", "Avatar")',
        'rating|1-5.1': 4.5,
        'ratingCount|10-500': 50
      },
      // 商品规格
      'specifications': function() {
        if (Mock.Random.boolean(0.7)) {
          return [
            { key: '品牌', value: Mock.Random.pick(['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'MUJI', 'UNIQLO', 'Nike']) },
            { key: '型号', value: `Model-${Mock.Random.string('upper', 2)}${Mock.Random.string('number', 4)}` },
            { key: '材质', value: Mock.Random.pick(['塑料', '金属', '合金', '木质', '纸质', '布料', '复合材质']) },
            { key: '尺寸', value: `${Mock.Random.integer(1, 100)}cm × ${Mock.Random.integer(1, 100)}cm × ${Mock.Random.integer(1, 30)}cm` },
            { key: '生产日期', value: Mock.Random.date('yyyy-MM-dd') }
          ];
        }
        return [];
      }
    }]
  }).list;
};

// 商品数据
const allProducts = generateProducts(300);

// 促销商品
const promotionProducts = allProducts.slice(0, 12).map(product => ({
  ...product,
  isPromotion: true,
  promotionPrice: (product.price * 0.8).toFixed(2),
  promotionEndTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss')
}));

// 推荐商品
const recommendProducts = allProducts.slice(12, 24).map(product => ({
  ...product,
  isRecommended: true
}));

// 热门商品
const hotProducts = [...allProducts].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10);

// 最新商品
const newProducts = [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

// Mock 获取商品列表接口
Mock.mock(/\/api\/product\/list/, 'get', (options) => {
  console.log('拦截到商品列表请求:', options.url);
  const params = getUrlParams(options.url);
  console.log('解析的请求参数:', params);
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const categoryId = params.categoryId ? parseInt(params.categoryId) : null;
  const keyword = params.keyword;
  const sort = params.sort || 'newest';
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
  const sellerId = params.sellerId ? parseInt(params.sellerId) : null;
  const condition = params.condition;
  const tag = params.tag;
  const isPromotional = params.isPromotional === 'true';
  const isRecommended = params.isRecommended === 'true';
  
  // 过滤数据
  let filteredProducts = [...allProducts];
  
  // 根据分类过滤
  if (categoryId) {
    filteredProducts = filteredProducts.filter(product => product.categoryId === categoryId);
  }
  
  // 根据关键词过滤
  if (keyword) {
    const regex = new RegExp(keyword, 'i');
    filteredProducts = filteredProducts.filter(product => 
      regex.test(product.title) || 
      regex.test(product.description) || 
      regex.test(product.brief)
    );
  }
  
  // 根据价格区间过滤
  if (minPrice !== null) {
    filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
  }
  
  if (maxPrice !== null) {
    filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
  }
  
  // 根据卖家过滤
  if (sellerId) {
    filteredProducts = filteredProducts.filter(product => product.seller.id === sellerId);
  }
  
  // 根据商品状态过滤
  if (condition) {
    filteredProducts = filteredProducts.filter(product => product.condition === condition);
  }
  
  // 根据标签过滤
  if (tag) {
    filteredProducts = filteredProducts.filter(product => product.tags && product.tags.includes(tag));
  }
  
  // 促销商品过滤
  if (isPromotional) {
    filteredProducts = filteredProducts.filter(product => product.isPromotion);
  }
  
  // 推荐商品过滤
  if (isRecommended) {
    filteredProducts = filteredProducts.filter(product => product.isRecommended);
  }
  
  // 根据排序字段排序
  console.log('处理排序，排序方式:', sort);
  if (sort === 'newest' || sort === 'latest') {
    filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sort === 'popular' || sort === 'hot') {
    // 热门排序：根据查看次数和点赞数加权排序
    console.log('使用热门排序');
    filteredProducts.sort((a, b) => {       
      const scoreA = a.viewCount * 0.7 + a.likeCount * 0.3;
      const scoreB = b.viewCount * 0.7 + b.likeCount * 0.3;
      return scoreB - scoreA;
    });
  } else if (sort === 'sales') {
    filteredProducts.sort((a, b) => b.salesCount - a.salesCount);
  }
  
  // 分页处理
  const start = (page - 1) * limit;
  const end = start + limit;
  const pagedProducts = filteredProducts.slice(start, end);
  
  console.log(`返回商品列表，页码:${page}, 条数:${pagedProducts.length}, 总数:${filteredProducts.length}`);
  
  // 处理字段编码
  const processedProducts = pagedProducts.map(product => {
    // 创建深拷贝以避免影响原数据
    const newProduct = JSON.parse(JSON.stringify(product));
    
    // 修复编码问题的字段
    if (typeof newProduct.title === 'string' && /[\u0080-\uffff]/.test(newProduct.title)) {
      newProduct.title = '商品标题';
    }
    
    if (typeof newProduct.description === 'string' && /[\u0080-\uffff]/.test(newProduct.description)) {
      newProduct.description = '商品描述内容';
    }
    
    if (typeof newProduct.brief === 'string' && /[\u0080-\uffff]/.test(newProduct.brief)) {
      newProduct.brief = '商品简介';
    }
    
    if (typeof newProduct.category === 'string' && /[\u0080-\uffff]/.test(newProduct.category)) {
      newProduct.category = '电子产品';
    }
    
    if (typeof newProduct.condition === 'string' && /[\u0080-\uffff]/.test(newProduct.condition)) {
      newProduct.condition = '全新';
    }
    
    if (newProduct.seller && typeof newProduct.seller.nickname === 'string' && 
        /[\u0080-\uffff]/.test(newProduct.seller.nickname)) {
      newProduct.seller.nickname = '用户';
    }
    
    return newProduct;
  });

  // 延迟响应
  delay(300);
  
  return {
    code: 200,
    message: '获取商品列表成功',
    data: {
      total: filteredProducts.length,
      page,
      limit,
      list: processedProducts
    }
  };
});

// Mock 获取商品详情接口
Mock.mock(/\/api\/product\/detail\/\d+/, 'get', (options) => {
  const id = parseInt(options.url.match(/\/detail\/(\d+)/)[1]);
  const product = allProducts.find(p => p.id === id);
  
  if (!product) {
    return {
      code: 404,
      message: '商品不存在'
    };
  }
  
  // 增加查看次数
  product.viewCount += 1;
  
  // 添加相关商品
  const relatedProducts = allProducts
    .filter(p => p.id !== id && p.categoryId === product.categoryId)
    .slice(0, 6)
    .map(({ id, title, price, images, thumbnails }) => ({ id, title, price, image: images[0], thumbnail: thumbnails[0] }));
  
  delay(200);
  
  return {
    code: 200,
    message: '获取商品详情成功',
    data: {
      ...product,
      relatedProducts
    }
  };
});

// Mock 获取商品分类接口
Mock.mock(/\/api\/product\/categories/, 'get', () => {
  delay(100);
  
  return {
    code: 200,
    message: '获取商品分类成功',
    data: productCategories
  };
});

// Mock 发布商品接口
Mock.mock(/\/api\/product\/publish/, 'post', (options) => {
  const body = getRequestBody(options);
  
  // 验证必填字段
  if (!body.title || !body.price || !body.categoryId || !body.description || !body.images || body.images.length === 0) {
    return {
      code: 400,
      message: '请完善商品信息'
    };
  }
  
  const categoryObj = productCategories.find(c => c.id === parseInt(body.categoryId));
  if (!categoryObj) {
    return {
      code: 400,
      message: '无效的商品分类'
    };
  }
  
  // 创建新商品
  const newProduct = {
    id: allProducts.length + 1,
    title: body.title,
    description: body.description,
    brief: body.brief || body.description.substring(0, 100) + '...',
    price: parseFloat(body.price),
    originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : parseFloat(body.price) * 1.2,
    categoryId: parseInt(body.categoryId),
    category: categoryObj.name,
    tags: body.tags || [],
    condition: body.condition || '全新',
    stock: body.stock || 1,
    salesCount: 0,
    viewCount: 0,
    likeCount: 0,
    isLiked: false,
    status: 'on_sale',
    images: body.images,
    thumbnails: body.thumbnails || body.images.map(img => img),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: body.location || '未知',
    seller: {
      id: 1, // 当前登录用户
      username: 'current_user',
      nickname: '当前用户',
      avatar: Mock.Random.image('80x80', '#ffcc33', '#FFF', 'Avatar'),
      rating: 5.0,
      ratingCount: 0
    },
    specifications: body.specifications || []
  };
  
  // 添加到商品列表
  allProducts.unshift(newProduct);
  
  delay(500);
  
  return {
    code: 200,
    message: '发布商品成功',
    data: {
      id: newProduct.id
    }
  };
});

// Mock 更新商品接口
Mock.mock(/\/api\/product\/update\/\d+/, 'put', (options) => {
  const id = parseInt(options.url.match(/\/update\/(\d+)/)[1]);
  const body = getRequestBody(options);
  const product = allProducts.find(p => p.id === id);
  
  if (!product) {
    return {
      code: 404,
      message: '商品不存在'
    };
  }
  
  // 检查是否商品所有者
  if (product.seller.id !== 1) { // 假设当前用户 ID 为 1
    return {
      code: 403,
      message: '只有商品发布者才能修改商品'
    };
  }
  
  // 更新字段
  if (body.title) product.title = body.title;
  if (body.description) product.description = body.description;
  if (body.brief) product.brief = body.brief;
  if (body.price) product.price = parseFloat(body.price);
  if (body.originalPrice) product.originalPrice = parseFloat(body.originalPrice);
  if (body.categoryId) {
    const categoryObj = productCategories.find(c => c.id === parseInt(body.categoryId));
    if (categoryObj) {
      product.categoryId = parseInt(body.categoryId);
      product.category = categoryObj.name;
    }
  }
  if (body.tags) product.tags = body.tags;
  if (body.condition) product.condition = body.condition;
  if (body.stock) product.stock = parseInt(body.stock);
  if (body.status) product.status = body.status;
  if (body.images) product.images = body.images;
  if (body.thumbnails) product.thumbnails = body.thumbnails;
  if (body.location) product.location = body.location;
  if (body.specifications) product.specifications = body.specifications;
  
  product.updatedAt = new Date().toISOString();
  
  delay(300);
  
  return {
    code: 200,
    message: '更新商品成功',
    data: product
  };
});

// Mock 删除商品接口
Mock.mock(/\/api\/product\/delete\/\d+/, 'delete', (options) => {
  const id = parseInt(options.url.match(/\/delete\/(\d+)/)[1]);
  const index = allProducts.findIndex(p => p.id === id);
  
  if (index === -1) {
    return {
      code: 404,
      message: '商品不存在'
    };
  }
  
  // 检查是否商品所有者
  if (allProducts[index].seller.id !== 1) { // 假设当前用户 ID 为 1
    return {
      code: 403,
      message: '只有商品发布者才能删除商品'
    };
  }
  
  // 删除商品
  allProducts.splice(index, 1);
  
  delay(200);
  
  return {
    code: 200,
    message: '删除商品成功'
  };
});

// Mock 商品点赞接口
Mock.mock(/\/api\/product\/like\/\d+/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/like\/(\d+)/)[1]);
  const body = getRequestBody(options);
  const product = allProducts.find(p => p.id === id);
  
  if (!product) {
    return {
      code: 404,
      message: '商品不存在'
    };
  }
  
  // 更新点赞状态
  const isLike = body.like !== false;
  
  if (isLike && !product.isLiked) {
    product.likeCount += 1;
    product.isLiked = true;
  } else if (!isLike && product.isLiked) {
    product.likeCount = Math.max(0, product.likeCount - 1);
    product.isLiked = false;
  }
  
  delay(100);
  
  return {
    code: 200,
    message: isLike ? '点赞成功' : '取消点赞成功',
    data: {
      isLiked: product.isLiked,
      likeCount: product.likeCount
    }
  };
});

// Mock 获取促销商品接口
Mock.mock(/\/api\/product\/promotion/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const limit = parseInt(params.limit) || 10;
  
  const result = promotionProducts.slice(0, limit);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取促销商品成功',
    data: result
  };
});

// Mock 获取推荐商品接口
Mock.mock(/\/api\/product\/recommend/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const limit = parseInt(params.limit) || 10;
  
  const result = recommendProducts.slice(0, limit);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取推荐商品成功',
    data: result
  };
});

// Mock 获取热门商品接口
Mock.mock(/\/api\/product\/hot/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const limit = parseInt(params.limit) || 10;
  
  const result = hotProducts.slice(0, limit);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取热门商品成功',
    data: result
  };
});

// Mock 获取新品接口
Mock.mock(/\/api\/product\/new/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const limit = parseInt(params.limit) || 10;
  
  const result = newProducts.slice(0, limit);
  
  delay(200);
  
  return {
    code: 200,
    message: '获取新品成功',
    data: result
  };
});

// Mock 商品搜索建议接口
Mock.mock(/\/api\/product\/search\/suggest/, 'get', (options) => {
  const params = getUrlParams(options.url);
  const keyword = params.keyword;
  
  if (!keyword || keyword.length < 2) {
    return {
      code: 200,
      message: '获取搜索建议成功',
      data: []
    };
  }
  
  const regex = new RegExp(keyword, 'i');
  const suggestions = allProducts
    .filter(product => regex.test(product.title))
    .slice(0, 10)
    .map(product => ({
      id: product.id,
      title: product.title,
      thumbnail: product.thumbnails[0],
      price: product.price
    }));
  
  delay(100);
  
  return {
    code: 200,
    message: '获取搜索建议成功',
    data: suggestions
  };
});

// Mock 举报商品接口
Mock.mock(/\/api\/product\/report\/\d+/, 'post', (options) => {
  const id = parseInt(options.url.match(/\/report\/(\d+)/)[1]);
  const body = getRequestBody(options);
  
  if (!body.reason) {
    return {
      code: 400,
      message: '举报原因不能为空'
    };
  }
  
  const product = allProducts.find(p => p.id === id);
  
  if (!product) {
    return {
      code: 404,
      message: '商品不存在'
    };
  }
  
  delay(300);
  
  return {
    code: 200,
    message: '举报成功，我们会尽快审核',
    data: {
      reportId: Mock.Random.guid()
    }
  };
});

export default {
  allProducts,
  promotionProducts,
  recommendProducts,
  hotProducts,
  newProducts,
  productCategories
};