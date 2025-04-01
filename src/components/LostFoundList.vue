<template>
  <div class="lost-found-list-component">
    <!-- 顶部选项卡切换 -->
    <div class="tabs-container" v-if="showTabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>
    
    <!-- 过滤栏 -->
    <div class="filter-bar" v-if="showFilter">
      <div 
        v-for="filter in filters" 
        :key="filter.type"
        class="filter-item"
        :class="{ active: activeFilters[filter.type] !== filter.defaultValue }"
        @click="showFilterOptions(filter.type)"
      >
        {{ getFilterLabel(filter) }}
        <i class="icon-arrow-down"></i>
      </div>
    </div>
    
    <!-- 列表内容 -->
    <div class="list-container" v-if="items.length > 0">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="lost-found-item"
        @click="goToDetail(item.id)"
      >
        <!-- 物品图片 -->
        <div class="item-image" v-if="item.images && item.images.length > 0">
          <img 
            :src="getImageUrl(item)" 
            :alt="item.title"
            @error="(e) => handleImageError(e, item)"
            loading="lazy"
          >
        </div>
        <div class="item-placeholder" v-else>
          <i :class="item.type === 'lost' ? 'icon-lost' : 'icon-found'"></i>
        </div>
        
        <!-- 物品信息 -->
        <div class="item-info">
          <!-- 物品标题 -->
          <div class="item-title-row">
            <div class="item-type-tag" :class="item.type">
              {{ item.type === 'lost' ? '寻物' : '招领' }}
            </div>
            <div class="item-title">{{ item.title }}</div>
          </div>
          
          <!-- 物品描述 -->
          <div class="item-description">{{ item.description }}</div>
          
          <!-- 物品元数据 -->
          <div class="item-meta">
            <div class="meta-item">
              <i class="icon-category"></i>
              <span>{{ item.category }}</span>
            </div>
            <div class="meta-item">
              <i class="icon-location"></i>
              <span>{{ item.location }}</span>
            </div>
            <div class="meta-item">
              <i class="icon-time"></i>
              <span>{{ formatTime(item.eventTime) }}</span>
            </div>
          </div>
          
          <!-- 悬赏信息 -->
          <div class="reward-info" v-if="item.type === 'lost' && item.reward">
            <i class="icon-reward"></i>
            <span class="reward-amount">悬赏 ¥{{ item.reward }}</span>
          </div>
          
          <!-- 物品状态 -->
          <div class="item-status-row">
            <div class="item-status" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status, item.type) }}
            </div>
            <div class="item-time">{{ formatTimeAgo(item.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading && !items.length">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 空状态 -->
    <empty-state
      v-if="!loading && !items.length"
      icon="search"
      :text="emptyText"
      :action-text="showEmptyAction ? emptyActionText : ''"
      @action="handleEmptyAction"
    />
    
    <!-- 上拉加载更多 -->
    <div class="load-more" v-if="items.length > 0 && hasMore">
      <div class="loading-spinner small" v-if="loadingMore"></div>
      <div class="load-more-text" v-else>上拉加载更多</div>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="items.length > 0 && !hasMore && !loading">
      已经到底了~
    </div>
    
    <!-- 筛选弹窗 -->
    <div class="filter-popup" v-if="showFilterPopup">
      <div class="popup-mask" @click="hideFilterPopup"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">{{ currentFilter ? currentFilter.label : '筛选' }}</div>
          <div class="popup-close" @click="hideFilterPopup">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="filter-options" v-if="currentFilter">
          <div 
            v-for="option in currentFilter.options" 
            :key="option.value"
            class="filter-option"
            :class="{ active: activeFilters[currentFilter.type] === option.value }"
            @click="selectFilterOption(option.value)"
          >
            {{ option.label }}
            <i class="icon-check" v-if="activeFilters[currentFilter.type] === option.value"></i>
          </div>
        </div>
        
        <div class="filter-actions" v-if="currentFilter && currentFilter.type === 'time'">
          <div class="action-btn reset" @click="resetDateRange">重置</div>
          <div class="action-btn confirm" @click="confirmFilter">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLostFoundList } from '@/api/lostFound'
import EmptyState from '@/components/common/EmptyState.vue'

// 组件props
const props = defineProps({
  // 默认选中的标签
  defaultTab: {
    type: String,
    default: 'all' // all, lost, found
  },
  // 是否显示标签
  showTabs: {
    type: Boolean,
    default: true
  },
  // 是否显示过滤器
  showFilter: {
    type: Boolean,
    default: true
  },
  // 用户ID，获取指定用户的失物招领
  userId: {
    type: [String, Number],
    default: ''
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 10
  },
  // 是否显示空状态操作按钮
  showEmptyAction: {
    type: Boolean,
    default: false
  }
})

// 组件事件
const emit = defineEmits(['refresh', 'emptyAction', 'tabChange'])

const router = useRouter()

// 状态变量
const loading = ref(false)
const loadingMore = ref(false)
const items = ref([])
const activeTab = ref(props.defaultTab)
const page = ref(1)
const hasMore = ref(true)
const showFilterPopup = ref(false)
const currentFilter = ref(null)
const activeFilters = reactive({
  category: 'all',   // 物品类别: all-全部, electronics-电子产品, books-书籍, cards-卡片证件, clothing-衣物, other-其他
  location: 'all',   // 地点: all-全部, classroom-教室, library-图书馆, canteen-食堂, dormitory-宿舍, other-其他
  status: 'all',     // 状态: all-全部, pending-处理中, found/claimed-已找到/已认领, closed-已关闭
  time: 'all'        // 时间: all-全部, today-今天, yesterday-昨天, this_week-本周, this_month-本月, custom-自定义
})

// 筛选器配置
const filters = [
  {
    type: 'category',
    label: '物品类别',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部类别' },
      { value: 'electronics', label: '电子产品' },
      { value: 'books', label: '书籍资料' },
      { value: 'cards', label: '卡片证件' },
      { value: 'clothing', label: '衣物饰品' },
      { value: 'daily', label: '日常用品' },
      { value: 'other', label: '其他物品' }
    ]
  },
  {
    type: 'location',
    label: '丢失/拾获地点',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部地点' },
      { value: 'classroom', label: '教室' },
      { value: 'library', label: '图书馆' },
      { value: 'canteen', label: '食堂' },
      { value: 'dormitory', label: '宿舍' },
      { value: 'playground', label: '操场' },
      { value: 'other', label: '其他地点' }
    ]
  },
  {
    type: 'status',
    label: '处理状态',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部状态' },
      { value: 'pending', label: '处理中' },
      { value: 'found', label: '已找到' },
      { value: 'claimed', label: '已认领' },
      { value: 'closed', label: '已关闭' }
    ]
  },
  {
    type: 'time',
    label: '时间筛选',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部时间' },
      { value: 'today', label: '今天' },
      { value: 'yesterday', label: '昨天' },
      { value: 'this_week', label: '本周' },
      { value: 'this_month', label: '本月' },
      { value: 'custom', label: '自定义时间' }
    ]
  }
]

// 获取过滤器显示文本
const getFilterLabel = (filter) => {
  const value = activeFilters[filter.type]
  
  if (value === filter.defaultValue) {
    return filter.label
  }
  
  const option = filter.options.find(opt => opt.value === value)
  return option ? option.label : filter.label
}

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  page.value = 1
  items.value = []
  hasMore.value = true
  
  // 通知父组件标签变化
  emit('tabChange', tab)
  
  fetchItems()
}

// 显示过滤器选项
const showFilterOptions = (type) => {
  currentFilter.value = filters.find(f => f.type === type)
  showFilterPopup.value = true
}

// 隐藏过滤器弹窗
const hideFilterPopup = () => {
  showFilterPopup.value = false
  currentFilter.value = null
}

// 选择过滤器选项
const selectFilterOption = (value) => {
  if (!currentFilter.value) return
  
  activeFilters[currentFilter.value.type] = value
  
  // 时间筛选需要额外处理
  if (currentFilter.value.type === 'time' && value === 'custom') {
    // 自定义时间选择逻辑
    // 在实际应用中，这里可能会显示一个日期选择器
    return
  }
  
  // 重置页码并重新获取数据
  page.value = 1
  items.value = []
  hasMore.value = true
  
  hideFilterPopup()
  fetchItems()
}

// 重置日期范围
const resetDateRange = () => {
  // 重置自定义日期范围
  // 在实际应用中，这里会重置日期选择器的值
}

// 确认筛选
const confirmFilter = () => {
  // 确认自定义日期范围
  hideFilterPopup()
  
  // 重置页码并重新获取数据
  page.value = 1
  items.value = []
  hasMore.value = true
  
  fetchItems()
}

// 获取图片URL
const getImageUrl = (item) => {
  if (!item || (!item.images && !item.imageUrl)) {
    return `https://picsum.photos/id/${(item?.id || 1) % 30 + 1}/300/300`;
  }
  
  // 如果已有解析好的imageUrl
  if (item.imageUrl) {
    return item.imageUrl;
  }
  
  // 处理images字段
  if (item.images) {
    // 如果images是数组
    if (Array.isArray(item.images)) {
      if (item.images.length > 0) {
        const firstImage = item.images[0];
        // 处理嵌套的JSON字符串情况
        if (typeof firstImage === 'string') {
          try {
            // 可能是JSON字符串数组 ["[\"url\"]"]
            if (firstImage.includes('[') && firstImage.includes(']')) {
              const parsed = JSON.parse(firstImage);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0];
              }
            }
            return firstImage;
          } catch (e) {
            console.error('解析失物招领图片失败:', e, firstImage);
            return firstImage;
          }
        }
      }
    }
    // 如果images是字符串
    else if (typeof item.images === 'string') {
      try {
        if (item.images.includes('[') && item.images.includes(']')) {
          const parsed = JSON.parse(item.images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
        }
        return item.images;
      } catch (e) {
        console.error('解析失物招领图片字符串失败:', e);
        return item.images;
      }
    }
  }
  
  // 默认图片
  return `https://picsum.photos/id/${(item.id || 1) % 30 + 1}/300/300`;
};

// 处理图片解析和清理特殊字符
const processItems = (items) => {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    const processedItem = { ...item };
    
    // 处理图片
    if (processedItem.images) {
      try {
        // 解析嵌套JSON字符串
        if (Array.isArray(processedItem.images) && processedItem.images.length > 0) {
          const firstImage = processedItem.images[0];
          if (typeof firstImage === 'string' && firstImage.includes('[') && firstImage.includes(']')) {
            const parsed = JSON.parse(firstImage);
            processedItem.imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } else {
            processedItem.imageUrl = firstImage;
          }
        } else if (typeof processedItem.images === 'string') {
          if (processedItem.images.includes('[') && processedItem.images.includes(']')) {
            const parsed = JSON.parse(processedItem.images);
            processedItem.imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } else {
            processedItem.imageUrl = processedItem.images;
          }
        }
      } catch (e) {
        console.error('处理失物招领图片失败:', e, processedItem.images);
      }
    }
    
    // 处理类型字段中的特殊字符
    if (processedItem.type === '\u0000' || !processedItem.type) {
      processedItem.type = 'found'; // 默认为招领启事
    }
    
    // 处理状态字段中的特殊字符
    if (processedItem.status === '\u0000' || !processedItem.status) {
      processedItem.status = 'open'; // 默认为进行中
    }
    
    // 处理分类字段
    if (!processedItem.category) {
      processedItem.category = '未分类';
    }
    
    // 确保发布者信息存在
    if (!processedItem.publisher) {
      processedItem.publisher = {
        id: processedItem.publisherId || 0,
        nickname: processedItem.publisherName || '未知用户',
        avatar: processedItem.publisherAvatar || ''
      };
    }
    
    return processedItem;
  });
};

// 获取失物招领列表
const fetchItems = async () => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    console.log('获取失物招领列表，参数:', {
      page: page.value,
      limit: props.pageSize,
      type: activeTab.value,
      status: activeFilters.status,
      category: activeFilters.category,
      location: activeFilters.location,
      time: activeFilters.time
    });
    
    const response = await getLostFoundList({
      page: page.value,
      limit: props.pageSize,
      type: activeTab.value === 'all' ? '' : activeTab.value,
      status: activeFilters.status === 'all' ? '' : activeFilters.status,
      category: activeFilters.category === 'all' ? '' : activeFilters.category,
      location: activeFilters.location === 'all' ? '' : activeFilters.location,
      time: activeFilters.time === 'all' ? '' : activeFilters.time
    });
    
    // 记录原始响应
    console.log('失物招领列表原始响应:', response);
    
    if (response && (response.code === 200 || response.success)) {
      // 处理接口返回的数据结构不一致的情况
      let responseData = response.data;
      
      // 如果data属性不存在，直接使用response
      if (!responseData && (response.list || Array.isArray(response))) {
        responseData = response;
      }
      
      // 从不同的数据结构中提取列表数据
      let itemList = [];
      let total = 0;
      
      if (Array.isArray(responseData)) {
        itemList = responseData;
        total = responseData.length;
      } else if (responseData.list && Array.isArray(responseData.list)) {
        itemList = responseData.list;
        total = responseData.total || responseData.list.length;
      } else if (Array.isArray(responseData.data)) {
        itemList = responseData.data;
        total = responseData.total || responseData.data.length;
      }
      
      // 处理返回的数据
      const processedList = processItems(itemList);
      console.log('处理后的失物招领列表:', processedList);
      
      // 更新视图数据
      if (page.value === 1) {
        items.value = processedList; // 首页加载，直接替换数据
      } else {
        items.value = [...items.value, ...processedList]; // 加载更多，追加数据
      }
      
      // 更新分页信息
      totalItems.value = total;
      hasMore.value = items.value.length < total;
      loadingMore.value = false;
    } else {
      console.error('获取失物招领列表失败:', response);
    }
  } catch (error) {
    console.error('获取失物招领列表异常:', error);
  } finally {
    loading.value = false;
    
    // 通知父组件加载状态变化
    emit('loading', false);
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  
  return `${month}-${day}`
}

// 格式化时间差
const formatTimeAgo = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  // 小于1分钟
  if (diff < 60) {
    return '刚刚'
  }
  // 小于1小时
  else if (diff < 3600) {
    return Math.floor(diff / 60) + '分钟前'
  }
  // 小于24小时
  else if (diff < 86400) {
    return Math.floor(diff / 3600) + '小时前'
  }
  // 小于30天
  else if (diff < 2592000) {
    return Math.floor(diff / 86400) + '天前'
  }
  // 超过30天
  else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 获取状态文本
const getStatusText = (status, type) => {
  if (type === 'lost') {
    if (status === 'pending') return '寻找中'
    if (status === 'found') return '已找到'
    if (status === 'closed') return '已关闭'
  } else {
    if (status === 'pending') return '待认领'
    if (status === 'claimed') return '已认领'
    if (status === 'closed') return '已关闭'
  }
  
  return '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
  if (status === 'pending') return 'status-pending'
  if (status === 'found' || status === 'claimed') return 'status-success'
  if (status === 'closed') return 'status-closed'
  
  return 'status-pending'
}

// 获取空状态文本
const getEmptyText = () => {
  if (activeTab.value === 'lost') {
    return '暂无寻物启事'
  } else if (activeTab.value === 'found') {
    return '暂无招领启事'
  } else {
    return '暂无失物招领信息'
  }
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/lost-found/detail/${id}`)
}

// 处理图片加载错误
const handleImageError = (event, item) => {
  console.warn(`失物招领图片加载失败: ${item.id}`, event.target.src);
  
  // 检查是否已经是占位图，避免循环加载
  if (event.target.getAttribute('data-is-placeholder') === 'true') {
    console.log('已经是占位图，不再替换');
    return;
  }
  
  // 使用物品ID确保每个物品有不同的图片
  const randomId = (item.id % 30) + 1;
  const timestamp = new Date().getTime();
  event.target.src = `https://picsum.photos/id/${randomId}/300/300?t=${timestamp}`;
  
  // 标记这个图片已经使用了占位图
  event.target.setAttribute('data-is-placeholder', 'true');
};

// 处理空状态操作
const handleEmptyAction = () => {
  emit('emptyAction', activeTab.value)
}

// 加载更多数据
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  
  page.value++
  fetchItems()
}

// 刷新列表
const refresh = () => {
  page.value = 1
  items.value = []
  hasMore.value = true
  fetchItems()
}

// 监听用户ID变化，重新获取数据
watch(() => props.userId, () => {
  page.value = 1
  items.value = []
  hasMore.value = true
  fetchItems()
})

watch(() => props.defaultTab, (newVal) => {
  if (newVal !== activeTab.value) {
    switchTab(newVal)
  }
})

// 上拉加载更多处理
let scrollListener = null
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = document.documentElement.clientHeight || window.innerHeight
  
  // 距离底部100px时加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

onMounted(() => {
  fetchItems()
  
  // 添加滚动监听
  scrollListener = window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 移除滚动监听
  if (scrollListener) {
    window.removeEventListener('scroll', handleScroll)
  }
})

// 暴露方法给父组件
defineExpose({
  refresh,
  switchTab
})
</script>

<style scoped>
.lost-found-list-component {
  width: 100%;
}

.tabs-container {
  display: flex;
  background-color: white;
  border-bottom: 1px solid var(--separator-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  color: var(--text-secondary);
  position: relative;
  transition: color 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.tab-item.active:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 1.5px;
}

.filter-bar {
  display: flex;
  background-color: white;
  position: relative;
  padding: 10px 0;
  border-bottom: 1px solid var(--separator-color);
  z-index: 5;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px 0;
  -webkit-tap-highlight-color: transparent;
}

.filter-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.list-container {
  padding: 12px;
  min-height: 200px;
}

.lost-found-item {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--info-color);
}

.lost-found-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.lost {
  border-left-color: var(--warning-color);
}

.found {
  border-left-color: var(--success-color);
}

.item-image {
  flex: 0 0 120px;
  height: 120px;
  overflow: hidden;
  background-color: var(--background-secondary);
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.item-img:hover {
  transform: scale(1.05);
}

.item-info {
  flex: 1;
  padding: 12px;
  position: relative;
}

.item-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.item-type-tag {
  padding: 2px 8px;
  border-radius: 10px;
  background-color: var(--info-color);
  color: white;
  margin-right: 8px;
}

.lost .item-type-tag {
  background-color: var(--warning-color);
}

.found .item-type-tag {
  background-color: var(--success-color);
}

.item-title {
  font-weight: 500;
  font-size: 16px;
  color: var(--text-primary);
  padding-right: 70px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-description {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reward-info {
  margin-top: 8px;
  margin-bottom: 8px;
}

.reward-amount {
  font-weight: 500;
  color: var(--primary-color);
}

.item-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-status {
  padding: 2px 8px;
  border-radius: 10px;
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--warning-color);
}

.lost .item-status {
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--warning-color);
}

.found .item-status {
  background-color: rgba(52, 199, 89, 0.1);
  color: var(--success-color);
}

.item-time {
  font-size: 12px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-tertiary);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(0, 122, 255, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.empty-svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 14px;
  color: var(--text-tertiary);
}

.empty-action {
  margin-top: 16px;
  padding: 8px 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 16px;
  font-size: 14px;
}

.load-more {
  text-align: center;
  padding: 16px 0;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
}

.load-more-text {
  color: var(--primary-color);
  font-size: 14px;
}

.filter-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  width: 80%;
  max-width: 400px;
  position: relative;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.popup-title {
  font-weight: 500;
  font-size: 15px;
}

.popup-close {
  color: var(--text-tertiary);
  font-size: 14px;
}

.filter-options {
  max-height: 300px;
  overflow-y: auto;
}

.filter-option {
  padding: 12px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--separator-light);
  color: var(--text-secondary);
}

.filter-option.active {
  color: var(--primary-color);
  font-weight: 500;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 16px;
  font-size: 14px;
}

.action-btn.reset {
  background-color: var(--text-tertiary);
  color: white;
}

.action-btn.confirm {
  background-color: var(--primary-color);
  color: white;
}
</style>