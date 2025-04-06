<template>
  <div class="publish-product-page">
    <!-- iOS风格顶部状态栏 -->
    <IosTop />
    
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
            :class="{ active: productForm.deliveryMethod === option.value }"
            @click="toggleDeliveryMethod(option.value)"
          >
            <div class="option-check radio">
              <div class="check-inner" v-if="productForm.deliveryMethod === option.value"></div>
            </div>
            <div class="option-label">{{ option.label }}</div>
          </div>
        </div>
      </div>
      
      <!-- 交易地点 -->
      <div class="form-section" v-if="productForm.deliveryMethod === 'meetup'">
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'
import ImageAnalyzer from '@/components/ai/ImageAnalyzer.vue'
import ContentGenerator from '@/components/ai/ContentGenerator.vue'
import IosTop from '@/components/Ios/IosTop.vue'
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
  deliveryMethod: 'meetup',
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
    productForm.deliveryMethod !== '' &&
    productForm.contactInfo.phone.trim() !== '' &&
    (productForm.deliveryMethod === 'meetup' ? productForm.location.trim() !== '' : true)
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
  productForm.deliveryMethod = method;
}

// 存储表单数据到本地存储
const saveFormDataToStorage = () => {
  localStorage.setItem('product_form_draft', JSON.stringify({
    title: productForm.title,
    category: productForm.category,
    price: productForm.price,
    originalPrice: productForm.originalPrice,
    condition: productForm.condition,
    description: productForm.description,
    images: productForm.images,
    deliveryMethod: productForm.deliveryMethod,
    contactInfo: productForm.contactInfo,
    // 不保存位置信息，因为位置信息会从URL中获取
  }));
  console.log('已保存表单数据到本地存储');
};

// 从本地存储中恢复表单数据
const restoreFormDataFromStorage = () => {
  const savedData = localStorage.getItem('product_form_draft');
  if (!savedData) return false;
  
  try {
    const formData = JSON.parse(savedData);
    console.log('从本地存储恢复表单数据:', formData);
    
    // 恢复表单数据
    if (formData.title) productForm.title = formData.title;
    if (formData.category) productForm.category = formData.category;
    if (formData.price) productForm.price = formData.price;
    if (formData.originalPrice) productForm.originalPrice = formData.originalPrice;
    if (formData.condition) productForm.condition = formData.condition;
    if (formData.description) productForm.description = formData.description;
    if (formData.images && formData.images.length) productForm.images = formData.images;
    if (formData.deliveryMethod) productForm.deliveryMethod = formData.deliveryMethod;
    if (formData.contactInfo) productForm.contactInfo = formData.contactInfo;
    
    return true;
  } catch (error) {
    console.error('恢复表单数据失败:', error);
    return false;
  }
};

// 清除本地存储的表单数据
const clearFormDataStorage = () => {
  localStorage.removeItem('product_form_draft');
  console.log('已清除表单数据本地存储');
};

// 修改跳转到地图选择页面的方法
const navigateToLocationPicker = () => {
  // 先保存当前表单内容
  saveFormDataToStorage();
  
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
};

// 修改发布商品方法，成功后清除草稿
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
    } else if (productForm.deliveryMethod === 'meetup' && productForm.location.trim() === '') {
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
    
    // 打印完整的表单数据
    console.log('完整的表单数据:', JSON.stringify(productForm, null, 2))
    
    // 转换分类为ID (临时解决方案)
    let categoryId = 1;
    const categoryMapping = {
      '电子产品': 1,
      '图书教材': 2,
      '日用百货': 3,
      '服装鞋帽': 4,
      '箱包配饰': 5,
      '美妆护肤': 6,
      '运动户外': 7,
      '乐器': 8,
      '自行车': 9,
      '家居家电': 10,
      '票券卡券': 11,
      '其他': 12
    };
    
    if (productForm.category && categoryMapping[productForm.category]) {
      categoryId = categoryMapping[productForm.category];
    }
    
    console.log('分类映射:', productForm.category, '->', categoryId);
    
    // 准备API请求数据
    const productData = {
      title: productForm.title,
      description: productForm.description,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      categoryId: categoryId,
      category: productForm.category, // 同时保留分类名称
      condition: productForm.condition,
      images: productForm.images.map(img => img.url),
      deliveryMethod: productForm.deliveryMethod,
      location: productForm.location,
      locationCoords: productForm.locationCoords,
      contactInfo: JSON.stringify(productForm.contactInfo),
      tags: productForm.tags || []
    }
    
    console.log('准备发送的商品数据(格式化):', JSON.stringify(productData, null, 2))
    
    // 导入API函数
    const { publishProduct } = await import('@/api/product')
    
    // 调用发布商品API
    console.log('开始调用publishProduct API...')
    const response = await publishProduct(productData)
    
    console.log('发布商品API响应:', response)
    
    // 检查响应
    if (!response) {
      console.error('API响应为空')
      showToast('发布失败：服务器响应为空')
      return
    }
    
    if (response && (response.code === 200 || response.success)) {
      showToast('发布成功')
      
      // 发布成功，清除草稿
      clearFormDataStorage();
      
      // 打印成功信息
      console.log('商品发布成功，准备跳转...')
      
      // 延迟跳转到首页或商品详情页
      setTimeout(() => {
        if (response.data && response.data.id) {
          // 如果返回了商品ID，跳转到商品详情页
          const productId = response.data.id
          console.log('跳转到商品详情页:', productId)
          // 先刷新页面，确保数据最新
          window.location.href = `/product/detail/${productId}`
        } else {
          // 否则刷新当前页面
          console.log('刷新当前页面')
          window.location.reload()
        }
      }, 1000)
    } else {
      // 显示错误信息
      const errorMsg = response?.message || '发布失败，请重试'
      console.error('发布失败:', errorMsg, response)
      showToast(errorMsg)
    }
  } catch (error) {
    console.error('发布商品异常:', error)
    showToast('发布失败：' + (error.message || '请重试'))
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

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

// 在onMounted前添加

// 修改onMounted钩子，添加恢复表单数据逻辑
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
  
  // 先尝试恢复表单数据
  const restored = restoreFormDataFromStorage();
  console.log('表单数据恢复状态:', restored);
  
  // 然后处理位置信息
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
  
  // 同时设置自动保存草稿
  window.addEventListener('beforeunload', saveFormDataToStorage);
});

// 在组件销毁时移除事件监听
onUnmounted(() => {
  window.removeEventListener('beforeunload', saveFormDataToStorage);
});
</script>

<style scoped>
/* iOS风格全局样式 */
.publish-product-page {
  background-color: #f2f2f7;
  min-height: 100vh;
  padding-bottom: 50px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  color: #1c1c1e;
}

/* iOS风格状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 16px;
  background-color: #f2f2f7;
  height: 24px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  gap: 8px;
}

/* iOS风格导航栏 */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  position: sticky;
  top: 24px;
  z-index: 100;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #007aff;
}

.icon-back::before {
  content: "←";
  font-size: 18px;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.publish-btn {
  padding: 6px 12px;
  background-color: #007aff;
  color: white;
  font-weight: 500;
  border-radius: 18px;
  font-size: 15px;
  transition: opacity 0.2s;
}

.publish-btn.disabled {
  opacity: 0.6;
}

/* AI助手按钮 */
.ai-assistant-btn {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 16px;
  border-radius: 16px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.ai-assistant-btn:active {
  transform: scale(0.98);
  background-color: rgba(0, 122, 255, 0.15);
}

.icon-ai::before {
  content: "✨";
  font-size: 16px;
}

/* 商品表单 */
.product-form {
  padding: 0 16px;
}

.form-section {
  margin-bottom: 24px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1c1c1e;
  display: flex;
  align-items: center;
}

.required {
  color: #ff3b30;
  margin-left: 4px;
}

.optional {
  color: #8e8e93;
  font-size: 14px;
  font-weight: normal;
}

/* 图片上传部分 */
.images-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.add-image-btn {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px dashed #c7c7cc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  background-color: #f2f2f7;
  transition: all 0.2s;
}

.add-image-btn:active {
  background-color: #e5e5ea;
}

.icon-camera::before {
  content: "📷";
  font-size: 24px;
  margin-bottom: 4px;
}

.images-tip {
  font-size: 13px;
  color: #8e8e93;
  margin-top: 8px;
}

.ai-image-analyzer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #007aff;
  font-size: 14px;
  margin-top: 12px;
  font-weight: 500;
}

.icon-analyze::before {
  content: "🔍";
  font-size: 16px;
}

/* 表单输入框 */
.input-container {
  position: relative;
}

.text-input {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-bottom: 1px solid #c7c7cc;
  font-size: 16px;
  color: #1c1c1e;
  background: transparent;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-bottom-color: #007aff;
}

.input-counter {
  position: absolute;
  right: 0;
  bottom: 12px;
  font-size: 12px;
  color: #8e8e93;
}

/* 分类选择 */
.category-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #c7c7cc;
}

.selected-category {
  color: #1c1c1e;
}

.icon-arrow-right::before {
  content: "›";
  font-size: 20px;
  color: #8e8e93;
}

/* 价格输入 */
.price-inputs {
  display: flex;
  gap: 16px;
}

.price-input-container {
  flex: 1;
}

.price-label {
  font-size: 14px;
  color: #8e8e93;
  margin-bottom: 8px;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #c7c7cc;
  padding-bottom: 8px;
}

.price-symbol {
  color: #1c1c1e;
  font-weight: 600;
  margin-right: 4px;
}

.price-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 4px 0;
  background: transparent;
}

/* 商品成色选择 */
.condition-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.condition-option {
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #f2f2f7;
  font-size: 14px;
  color: #8e8e93;
  font-weight: 500;
  transition: all 0.2s;
}

.condition-option.active {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

/* 文本域 */
.textarea-container {
  position: relative;
}

.text-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #c7c7cc;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.4;
  color: #1c1c1e;
  background: #f9f9f9;
  outline: none;
  resize: none;
  transition: border-color 0.2s;
}

.text-textarea:focus {
  border-color: #007aff;
  background: #ffffff;
}

.textarea-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: #8e8e93;
  background: rgba(249, 249, 249, 0.8);
  padding: 2px 6px;
  border-radius: 10px;
}

/* 交易方式 */
.delivery-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-check.radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #c7c7cc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.active .option-check.radio {
  border-color: #007aff;
}

.check-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #007aff;
}

.option-label {
  font-size: 16px;
  color: #1c1c1e;
}

/* 位置选择 */
.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #c7c7cc;
  cursor: pointer;
}

.selected-location, .placeholder-location {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placeholder-location {
  color: #8e8e93;
}

.icon-location::before {
  content: "📍";
  font-size: 18px;
  color: #007aff;
}

/* 联系方式 */
.contact-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-label {
  font-size: 14px;
  color: #8e8e93;
}

.contact-input {
  padding: 12px 0;
  border: none;
  border-bottom: 1px solid #c7c7cc;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.contact-input:focus {
  border-bottom-color: #007aff;
}

/* 分类选择器 */
.category-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.picker-mask {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
}

.picker-content {
  background-color: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5ea;
}

.picker-title {
  font-size: 17px;
  font-weight: 600;
}

.picker-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-close::before {
  content: "×";
  font-size: 24px;
  color: #8e8e93;
}

.picker-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 16px;
}

.picker-item {
  padding: 16px 0;
  border-bottom: 1px solid #e5e5ea;
  font-size: 16px;
  color: #1c1c1e;
}

.picker-item:last-child {
  border-bottom: none;
}

/* 提示信息 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 15px;
  z-index: 1100;
  max-width: 80%;
  text-align: center;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .publish-product-page {
    background-color: #1c1c1e;
    color: #ffffff;
  }
  
  .status-bar, .navigation-bar {
    background-color: #1c1c1e;
  }
  
  .navigation-bar {
    border-bottom-color: rgba(84, 84, 88, 0.65);
  }
  
  .form-section, .images-section {
    background-color: #2c2c2e;
    box-shadow: none;
  }
  
  .text-input, .contact-input, .price-input-wrapper, .category-select, .location-picker {
    border-bottom-color: #38383a;
    color: #ffffff;
  }
  
  .price-symbol, .option-label, .selected-category {
    color: #ffffff;
  }
  
  .text-textarea {
    background-color: #38383a;
    border-color: #38383a;
    color: #ffffff;
  }
  
  .condition-option {
    background-color: #38383a;
  }
  
  .add-image-btn {
    border-color: #38383a;
    background-color: #2c2c2e;
  }
  
  .picker-content, .picker-header {
    background-color: #2c2c2e;
  }
  
  .picker-header, .picker-item {
    border-bottom-color: #38383a;
  }
  
  .picker-item {
    color: #ffffff;
  }
}
</style>