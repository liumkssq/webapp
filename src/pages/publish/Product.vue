<template>
  <div class="publish-product-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">发布商品</div>
      <div class="publish-btn" @click="publishProduct" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>
    
    <!-- AI助手按钮 -->
    <div class="ai-assistant-btn" @click="showContentGenerator = true">
      <i class="icon-ai"></i>
      <span>AI文案助手</span>
    </div>
    
    <!-- 商品信息表单 -->
    <div class="product-form">
      <!-- 商品图片上传 -->
      <div class="images-section">
        <div class="section-title">商品图片 <span class="required">*</span></div>
        <div class="images-grid">
          <div
            v-for="(image, index) in productForm.images"
            :key="index"
            class="image-item"
          >
            <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
            <div class="delete-image" @click="removeImage(index)">
              <i class="icon-close"></i>
            </div>
          </div>
          
          <div class="add-image-btn" v-if="productForm.images.length < 5" @click="addImage">
            <i class="icon-camera"></i>
            <span>{{ productForm.images.length }}/5</span>
          </div>
        </div>
        <div class="images-tip">请上传清晰的商品照片，最多5张</div>
        
        <!-- AI图片分析入口 -->
        <div class="ai-image-analyzer-btn" v-if="productForm.images.length > 0" @click="showImageAnalyzer = true">
          <i class="icon-analyze"></i>
          <span>AI图片分析</span>
        </div>
      </div>
      
      <!-- 商品标题 -->
      <div class="form-section">
        <div class="section-title">商品标题 <span class="required">*</span></div>
        <div class="input-container">
          <input 
            type="text" 
            v-model="productForm.title" 
            placeholder="请输入商品标题，如：全新iPhone 14 Pro Max 256G 深空黑" 
            class="text-input"
            maxlength="30"
          >
          <div class="input-counter">{{ productForm.title.length }}/30</div>
        </div>
      </div>
      
      <!-- 商品分类 -->
      <div class="form-section">
        <div class="section-title">商品分类 <span class="required">*</span></div>
        <div class="category-select" @click="showCategoryPicker = true">
          <div class="selected-category">
            {{ productForm.category || '请选择分类' }}
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 商品价格 -->
      <div class="form-section">
        <div class="section-title">价格设置 <span class="required">*</span></div>
        <div class="price-inputs">
          <div class="price-input-container">
            <div class="price-label">售价</div>
            <div class="price-input-wrapper">
              <span class="price-symbol">¥</span>
              <input 
                type="number" 
                v-model="productForm.price" 
                placeholder="0.00" 
                class="price-input"
                min="0"
                step="0.01"
              >
            </div>
          </div>
          
          <div class="price-input-container">
            <div class="price-label">原价 <span class="optional">(选填)</span></div>
            <div class="price-input-wrapper">
              <span class="price-symbol">¥</span>
              <input 
                type="number" 
                v-model="productForm.originalPrice" 
                placeholder="0.00" 
                class="price-input"
                min="0"
                step="0.01"
              >
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品成色 -->
      <div class="form-section">
        <div class="section-title">商品成色 <span class="required">*</span></div>
        <div class="condition-options">
          <div 
            v-for="option in conditionOptions" 
            :key="option.value" 
            class="condition-option"
            :class="{ active: productForm.condition === option.value }"
            @click="productForm.condition = option.value"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
      
      <!-- 商品描述 -->
      <div class="form-section">
        <div class="section-title">商品描述 <span class="required">*</span></div>
        <div class="textarea-container">
          <textarea 
            v-model="productForm.description" 
            placeholder="请详细描述一下商品的使用年限、新旧程度、入手渠道、转手原因等信息，让买家更放心" 
            class="text-textarea"
            rows="4"
          ></textarea>
          <div class="textarea-counter">{{ productForm.description.length }}/500</div>
        </div>
      </div>
      
      <!-- 交易方式 -->
      <div class="form-section">
        <div class="section-title">交易方式 <span class="required">*</span></div>
        <div class="delivery-options">
          <div 
            v-for="option in deliveryOptions" 
            :key="option.value" 
            class="delivery-option"
            :class="{ active: productForm.deliveryMethod.includes(option.value) }"
            @click="toggleDeliveryMethod(option.value)"
          >
            <div class="option-check">
              <div class="check-inner" v-if="productForm.deliveryMethod.includes(option.value)"></div>
            </div>
            <div class="option-label">{{ option.label }}</div>
          </div>
        </div>
      </div>
      
      <!-- 交易地点 -->
      <div class="form-section" v-if="productForm.deliveryMethod.includes('meetup')">
        <div class="section-title">交易地点 <span class="required">*</span></div>
        <div class="location-picker" @click="navigateToLocationPicker">
          <div v-if="productForm.location" class="selected-location">
            <i class="icon-location"></i>
            <span>{{ productForm.location }}</span>
          </div>
          <div v-else class="placeholder-location">
            <i class="icon-location"></i>
            <span>点击选择交易地点</span>
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 联系方式 -->
      <div class="form-section">
        <div class="section-title">联系方式 <span class="required">*</span></div>
        <div class="contact-container">
          <div class="contact-item">
            <div class="contact-label">手机号</div>
            <input 
              type="tel" 
              v-model="productForm.contactInfo.phone" 
              placeholder="请输入手机号" 
              class="contact-input"
            >
          </div>
          
          <div class="contact-item">
            <div class="contact-label">微信号 <span class="optional">(选填)</span></div>
            <input 
              type="text" 
              v-model="productForm.contactInfo.wechat" 
              placeholder="请输入微信号" 
              class="contact-input"
            >
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分类选择器弹窗 -->
    <div class="category-picker" v-if="showCategoryPicker">
      <div class="picker-mask" @click="showCategoryPicker = false"></div>
      <div class="picker-content">
        <div class="picker-header">
          <div class="picker-title">选择分类</div>
          <div class="picker-close" @click="showCategoryPicker = false">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="picker-body">
          <div 
            v-for="category in categoryOptions" 
            :key="category" 
            class="picker-item"
            @click="selectCategory(category)"
          >
            {{ category }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
    
    <!-- AI图片分析弹出层 -->
    <van-popup
      v-model:show="showImageAnalyzer"
      position="bottom"
      round
      :style="{ height: '75%' }"
    >
      <image-analyzer
        :images="productForm.images"
        @select-title="handleSelectTitle"
        @select-tag="handleSelectTag"
        @apply-all="handleApplyAllSuggestions"
      />
    </van-popup>
    
    <!-- AI内容生成弹出层 -->
    <van-popup
      v-model:show="showContentGenerator"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <content-generator
        :product-info="productForm"
        :initial-prompt="generateInitialPrompt()"
        @close="showContentGenerator = false"
        @use-content="handleUseGeneratedContent"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'
import ImageAnalyzer from '@/components/ai/ImageAnalyzer.vue'
import ContentGenerator from '@/components/ai/ContentGenerator.vue'

const router = useRouter()
const userStore = useUserStore()

// 商品表单
const productForm = reactive({
  title: '',
  category: '',
  price: '',
  originalPrice: '',
  condition: 'new',
  description: '',
  images: [],
  deliveryMethod: ['meetup'],
  location: '',
  locationCoords: null,
  contactInfo: {
    phone: '',
    wechat: ''
  }
})

// 商品成色选项
const conditionOptions = [
  { label: '全新', value: 'new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '轻微使用痕迹', value: 'slight_used' },
  { label: '使用正常', value: 'used' },
  { label: '明显使用痕迹', value: 'heavily_used' }
]

// 交易方式选项
const deliveryOptions = [
  { label: '当面交易', value: 'meetup' },
  { label: '邮寄', value: 'shipping' }
]

// 分类选项
const categoryOptions = [
  '电子产品', '图书教材', '日用百货', '服装鞋帽', 
  '箱包配饰', '美妆护肤', '运动户外', '乐器', 
  '自行车', '家居家电', '票券卡券', '其他'
]

// 分类选择器
const showCategoryPicker = ref(false)

// 提示信息
const toast = reactive({
  show: false,
  message: ''
})

// 表单是否有效
const isFormValid = computed(() => {
  return (
    productForm.title.trim() !== '' &&
    productForm.category !== '' &&
    productForm.price > 0 &&
    productForm.description.trim() !== '' &&
    productForm.images.length > 0 &&
    productForm.deliveryMethod.length > 0 &&
    productForm.contactInfo.phone.trim() !== '' &&
    (productForm.deliveryMethod.includes('meetup') ? productForm.location.trim() !== '' : true)
  )
})

// 添加图片
const addImage = () => {
  // 在实际应用中，这里应该调用文件选择器
  if (productForm.images.length >= 5) {
    showToast('最多上传5张图片')
    return
  }
  
  // 模拟上传图片
  const mockImage = {
    id: Date.now(),
    url: `https://picsum.photos/300/300?random=${Math.floor(Math.random() * 1000)}`
  }
  
  productForm.images.push(mockImage)
}

// 移除图片
const removeImage = (index) => {
  productForm.images.splice(index, 1)
}

// 选择分类
const selectCategory = (category) => {
  productForm.category = category
  showCategoryPicker.value = false
}

// 切换交易方式
const toggleDeliveryMethod = (method) => {
  const index = productForm.deliveryMethod.indexOf(method)
  if (index === -1) {
    productForm.deliveryMethod.push(method)
  } else {
    // 确保至少有一种交易方式
    if (productForm.deliveryMethod.length > 1) {
      productForm.deliveryMethod.splice(index, 1)
    } else {
      showToast('至少选择一种交易方式')
    }
  }
}

// 发布商品
const publishProduct = async () => {
  if (!isFormValid.value) {
    if (productForm.images.length === 0) {
      showToast('请上传商品图片')
    } else if (productForm.title.trim() === '') {
      showToast('请输入商品标题')
    } else if (productForm.category === '') {
      showToast('请选择商品分类')
    } else if (productForm.price <= 0) {
      showToast('请设置合理的售价')
    } else if (productForm.description.trim() === '') {
      showToast('请填写商品描述')
    } else if (productForm.deliveryMethod.includes('meetup') && productForm.location.trim() === '') {
      showToast('请填写交易地点')
    } else if (productForm.contactInfo.phone.trim() === '') {
      showToast('请填写联系电话')
    }
    return
  }
  
  // 验证用户是否登录
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    showToast('发布中...')
    
    // 模拟API请求
    setTimeout(() => {
      showToast('发布成功')
      
      // 跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }, 1500)
  } catch (error) {
    console.error('发布商品失败', error)
    showToast('发布失败，请重试')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到地图选择页面
const navigateToLocationPicker = () => {
  // 将当前地址传递给地图选择页面（如果有）
  const query = productForm.locationCoords ? 
    { location: JSON.stringify(productForm.locationCoords) } : 
    {};
  
  // 导航到地图选择页面，并设置回调
  router.push({
    path: '/map/picker',
    query: {
      ...query,
      callback: '/publish/product'
    }
  });
}

// 在onMounted中添加
onMounted(() => {
  // 检查是否有地图选择的回调数据
  let locationDataFromUrl = null;
  const fullPath = window.location.href;
  console.log('URL完整路径:', fullPath);
  
  // 1. 先尝试常规方式获取
  locationDataFromUrl = router.currentRoute.value.query.location;
  console.log('Router查询参数:', router.currentRoute.value.query);
  
  // 2. 如果没有获取到，检查URL中是否有双问号或其他格式问题
  if (!locationDataFromUrl) {
    console.log('尝试从URL直接提取位置数据');
    
    // 使用正则表达式提取location参数，支持各种URL格式
    const locationMatch = fullPath.match(/[?&]location=([^&]+)/);
    if (locationMatch && locationMatch[1]) {
      locationDataFromUrl = decodeURIComponent(locationMatch[1]);
      console.log('从URL中提取的位置数据:', locationDataFromUrl);
    }
  }
  
  if (locationDataFromUrl) {
    try {
      console.log('接收到位置数据:', locationDataFromUrl);
      // 如果已经是对象，则不需要解析
      let location = typeof locationDataFromUrl === 'string' ? 
                   JSON.parse(decodeURIComponent(locationDataFromUrl)) : 
                   locationDataFromUrl;
      console.log('解析后的位置数据:', location);
      
      // 确保有address属性
      if (location.address) {
        productForm.location = location.address;
        productForm.locationCoords = {
          lng: location.lng,
          lat: location.lat
        };
        
        showToast('已自动填入交易地点');
        console.log('已设置位置信息:', productForm.location, productForm.locationCoords);
      } else {
        console.error('位置数据缺少address属性:', location);
        showToast('位置数据不完整，请重新选择');
      }
      
      // 清除URL中的location参数
      router.replace({
        path: router.currentRoute.value.path
      });
    } catch (e) {
      console.error('解析位置信息失败', e);
      showToast('位置信息解析失败');
    }
  } else {
    console.log('未检测到位置数据');
  }
});

// AI助手相关状态
const showImageAnalyzer = ref(false)
const showContentGenerator = ref(false)

// 处理AI图片分析结果
const handleSelectTitle = (title) => {
  productForm.title = title
}

const handleSelectTag = (tag) => {
  if (!productForm.tags) {
    productForm.tags = []
  }
  if (!productForm.tags.includes(tag)) {
    productForm.tags.push(tag)
  }
}

const handleApplyAllSuggestions = (suggestions) => {
  if (suggestions.title) {
    productForm.title = suggestions.title
  }
  
  if (suggestions.description) {
    productForm.description = suggestions.description
  }
  
  if (suggestions.price && !productForm.price) {
    productForm.price = suggestions.price
  }
  
  if (suggestions.tags && suggestions.tags.length > 0) {
    productForm.tags = [...suggestions.tags]
  }
}

// 处理AI内容生成结果
const handleUseGeneratedContent = (data) => {
  const { content, type } = data
  
  if (type === 'description') {
    productForm.description = content
  } else if (type === 'title') {
    productForm.title = content
  } else if (type === 'tags') {
    const tags = content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    productForm.tags = tags
  }
  
  showContentGenerator.value = false
}

// 生成初始提示词
const generateInitialPrompt = () => {
  const category = productForm.category || ''
  const condition = productForm.condition || ''
  
  return `帮我生成一个${condition}的${category}商品描述`
}
</script>

<style scoped>
/* 样式部分添加位置选择器样式 */

.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.selected-location, .placeholder-location {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placeholder-location {
  color: var(--placeholder-color);
}

.icon-location {
  font-size: 18px;
  color: var(--primary-color);
}

.icon-arrow-right {
  font-size: 16px;
  color: var(--icon-color);
}
</style>