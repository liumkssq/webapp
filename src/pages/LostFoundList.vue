<template>
  <div class="lostfound-list-page">
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
      <div class="nav-title">失物招领</div>
      <div class="search-btn" @click="goToSearch">
        <i class="icon-search"></i>
      </div>
    </div>
    
    <!-- 类型切换 -->
    <div class="type-tabs">
      <div 
        v-for="tab in typeTabs" 
        :key="tab.value" 
        class="type-tab"
        :class="{ active: currentType === tab.value }"
        @click="switchType(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div 
        v-for="filter in filters" 
        :key="filter.type" 
        class="filter-item"
        :class="{ active: activeFilters[filter.type] }"
        @click="toggleFilter(filter.type)"
      >
        {{ filter.label }}
        <i class="icon-arrow-down"></i>
      </div>
    </div>
    
    <!-- 失物招领列表 -->
    <div class="lostfound-container">
      <!-- 加载中 -->
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
      
      <!-- 数据列表 -->
      <div class="lostfound-list" v-else>
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="lostfound-card"
          @click="viewDetail(item.id)"
        >
          <div class="card-image" v-if="item.images && item.images.length > 0">
            <img :src="item.images[0]" :alt="item.title">
            <div class="card-badge" v-if="item.status !== '待认领'">
              {{ item.status }}
            </div>
          </div>
          <div class="card-content">
            <div class="card-title">{{ item.title }}</div>
            <div class="card-tags">
              <span class="card-tag type-tag">{{ item.type === 'lost' ? '寻物启事' : '招领启事' }}</span>
              <span class="card-tag category-tag">{{ item.category }}</span>
              <span class="card-tag" v-if="item.reward && item.type === 'lost'">
                有偿 {{ item.reward }}
              </span>
            </div>
            <div class="card-description">{{ item.description }}</div>
            <div class="card-location">
              <i class="icon-location"></i>
              <span>{{ item.location }}</span>
            </div>
            <div class="card-time">
              <i class="icon-time"></i>
              <span>{{ item.type === 'lost' ? '丢失时间：' : '拾到时间：' }}{{ formatTime(item.eventTime) }}</span>
            </div>
            <div class="card-meta">
              <div class="user-info">
                <img :src="item.user.avatar" class="user-avatar" :alt="item.user.name">
                <span class="user-name">{{ item.user.name }}</span>
              </div>
              <div class="post-time">{{ formatTime(item.createTime) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无数据提示 -->
      <div class="no-data" v-if="!loading && items.length === 0">
        <div class="no-data-icon">
          <i class="icon-empty"></i>
        </div>
        <div class="no-data-text">暂无{{ currentType === 'lost' ? '寻物启事' : currentType === 'found' ? '招领启事' : '失物招领信息' }}</div>
        <button class="action-btn" @click="goToPublish">
          立即{{ currentType === 'lost' ? '发布寻物启事' : '发布招领启事' }}
        </button>
      </div>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore && items.length > 0">
        <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
    
    <!-- 筛选弹窗 -->
    <div class="filter-popup" v-if="showFilterPopup">
      <div class="popup-mask" @click="showFilterPopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">筛选条件</div>
          <div class="popup-close" @click="showFilterPopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="popup-body">
          <!-- 分类筛选 -->
          <div class="filter-section">
            <div class="section-title">物品分类</div>
            <div class="category-options">
              <div 
                v-for="category in categories" 
                :key="category.value" 
                class="category-option"
                :class="{ active: selectedCategory === category.value }"
                @click="selectedCategory = category.value"
              >
                {{ category.label }}
              </div>
            </div>
          </div>
          
          <!-- 地点筛选 -->
          <div class="filter-section">
            <div class="section-title">地点区域</div>
            <div class="location-options">
              <div 
                v-for="location in locations" 
                :key="location.value" 
                class="location-option"
                :class="{ active: selectedLocation === location.value }"
                @click="selectedLocation = location.value"
              >
                {{ location.label }}
              </div>
            </div>
          </div>
          
          <!-- 时间筛选 -->
          <div class="filter-section">
            <div class="section-title">发布时间</div>
            <div class="time-options">
              <div 
                v-for="time in timePeriods" 
                :key="time.value" 
                class="time-option"
                :class="{ active: selectedTimePeriod === time.value }"
                @click="selectedTimePeriod = time.value"
              >
                {{ time.label }}
              </div>
            </div>
          </div>
          
          <!-- 状态筛选 -->
          <div class="filter-section">
            <div class="section-title">状态</div>
            <div class="status-options">
              <div 
                v-for="status in statuses" 
                :key="status.value" 
                class="status-option"
                :class="{ active: selectedStatus === status.value }"
                @click="selectedStatus = status.value"
              >
                {{ status.label }}
              </div>
            </div>
          </div>
          
          <!-- 按钮区 -->
          <div class="popup-buttons">
            <button class="reset-btn" @click="resetFilters">重置</button>
            <button class="confirm-btn" @click="confirmFilters">确定</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 时间弹窗 -->
    <div class="time-popup" v-if="showTimePopup">
      <div class="popup-mask" @click="showTimePopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">时间排序</div>
          <div class="popup-close" @click="showTimePopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="popup-body">
          <div 
            v-for="option in sortOptions" 
            :key="option.value" 
            class="sort-option"
            :class="{ active: currentSort === option.value }"
            @click="selectSort(option.value)"
          >
            {{ option.label }}
            <i class="icon-check" v-if="currentSort === option.value"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 发布按钮 -->
    <div class="floating-btn" @click="goToPublish">
      <i class="icon-plus"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 失物招领类型标签
const typeTabs = [
  { label: '全部', value: 'all' },
  { label: '寻物启事', value: 'lost' },
  { label: '招领启事', value: 'found' }
]

// 过滤器选项
const filters = [
  { label: '最新发布', type: 'time' },
  { label: '分类筛选', type: 'filter' }
]

// 当前激活的过滤器
const activeFilters = reactive({
  time: false,
  filter: false
})

// 排序选项
const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '最早发布', value: 'oldest' },
  { label: '丢失/拾到时间最近', value: 'eventRecent' },
  { label: '丢失/拾到时间最早', value: 'eventOldest' }
]

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '证件卡', value: 'card' },
  { label: '电子设备', value: 'electronics' },
  { label: '书籍资料', value: 'books' },
  { label: '钱包财物', value: 'wallet' },
  { label: '钥匙', value: 'keys' },
  { label: '饰品', value: 'accessories' },
  { label: '其他', value: 'others' }
]

// 地点选项
const locations = [
  { label: '全部', value: 'all' },
  { label: '教学楼', value: 'teachingBuilding' },
  { label: '图书馆', value: 'library' },
  { label: '食堂', value: 'canteen' },
  { label: '宿舍楼', value: 'dormitory' },
  { label: '操场', value: 'playground' },
  { label: '校门口', value: 'gate' },
  { label: '其他', value: 'others' }
]

// 时间筛选选项
const timePeriods = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '近三天', value: 'threeDays' },
  { label: '近一周', value: 'oneWeek' },
  { label: '近一个月', value: 'oneMonth' }
]

// 状态选项
const statuses = [
  { label: '全部状态', value: 'all' },
  { label: '待认领', value: 'pending' },
  { label: '已认领', value: 'claimed' },
  { label: '已找到', value: 'found' },
  { label: '已结束', value: 'closed' }
]

// 当前状态变量
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const showFilterPopup = ref(false)
const showTimePopup = ref(false)
const currentType = ref('all')
const currentSort = ref('newest')
const page = ref(1)
const pageSize = ref(10)
const items = ref([])

// 筛选变量
const selectedCategory = ref('all')
const selectedLocation = ref('all')
const selectedTimePeriod = ref('all')
const selectedStatus = ref('all')

// 获取失物招领数据
const fetchLostFoundItems = async () => {
  loading.value = true
  
  try {
    // 模拟API请求
    setTimeout(() => {
      // 生成模拟数据
      const mockItems = Array(10).fill().map((_, index) => {
        const id = Date.now() + index
        const isLost = Math.random() > 0.5
        
        return {
          id,
          title: isLost ? `寻找丢失的${getRandomItem()}` : `拾到一个${getRandomItem()}`,
          type: isLost ? 'lost' : 'found',
          category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1].label,
          description: isLost 
            ? `我在${getRandomLocation()}丢失了一个${getRandomItem()}，希望捡到的同学能联系我，感谢！` 
            : `在${getRandomLocation()}拾到一个${getRandomItem()}，失主请尽快联系认领。`,
          location: getRandomLocation(),
          images: Math.random() > 0.3 ? [`https://picsum.photos/300/200?random=${id}`] : [],
          reward: isLost && Math.random() > 0.6 ? `¥${Math.floor(Math.random() * 100) + 10}` : null,
          status: getRandomStatus(),
          eventTime: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
          createTime: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
          user: {
            name: `用户${Math.floor(Math.random() * 1000)}`,
            avatar: 'https://via.placeholder.com/40'
          }
        }
      })
      
      items.value = mockItems
      loading.value = false
      hasMore.value = true
    }, 800)
  } catch (error) {
    console.error('获取失物招领列表失败', error)
    loading.value = false
  }
}

// 获取随机物品名称
const getRandomItem = () => {
  const items = ['钱包', '手机', '钥匙', '学生证', '银行卡', '耳机', '书包', '雨伞', '水杯', '笔记本']
  return items[Math.floor(Math.random() * items.length)]
}

// 获取随机地点
const getRandomLocation = () => {
  return locations[Math.floor(Math.random() * (locations.length - 1)) + 1].label
}

// 获取随机状态
const getRandomStatus = () => {
  const statuses = ['待认领', '已认领', '已找到', '已结束']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

// 加载更多数据
const loadMore = async () => {
  if (loadingMore.value) return
  
  loadingMore.value = true
  page.value++
  
  try {
    // 模拟加载更多
    setTimeout(() => {
      const mockMoreItems = Array(10).fill().map((_, index) => {
        const id = Date.now() + index + 100
        const isLost = Math.random() > 0.5
        
        return {
          id,
          title: isLost ? `寻找丢失的${getRandomItem()}` : `拾到一个${getRandomItem()}`,
          type: isLost ? 'lost' : 'found',
          category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1].label,
          description: isLost 
            ? `我在${getRandomLocation()}丢失了一个${getRandomItem()}，希望捡到的同学能联系我，感谢！` 
            : `在${getRandomLocation()}拾到一个${getRandomItem()}，失主请尽快联系认领。`,
          location: getRandomLocation(),
          images: Math.random() > 0.3 ? [`https://picsum.photos/300/200?random=${id}`] : [],
          reward: isLost && Math.random() > 0.6 ? `¥${Math.floor(Math.random() * 100) + 10}` : null,
          status: getRandomStatus(),
          eventTime: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
          createTime: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
          user: {
            name: `用户${Math.floor(Math.random() * 1000)}`,
            avatar: 'https://via.placeholder.com/40'
          }
        }
      })
      
      items.value = [...items.value, ...mockMoreItems]
      loadingMore.value = false
      
      // 模拟加载到底
      if (page.value >= 3) {
        hasMore.value = false
      }
    }, 800)
  } catch (error) {
    console.error('加载更多失物招领数据失败', error)
    loadingMore.value = false
  }
}

// 切换失物招领类型
const switchType = (type) => {
  currentType.value = type
  
  // 重置并重新加载数据
  page.value = 1
  fetchLostFoundItems()
}

// 切换筛选器
const toggleFilter = (filterType) => {
  // 重置其他筛选器
  Object.keys(activeFilters).forEach(key => {
    if (key !== filterType) {
      activeFilters[key] = false
    }
  })
  
  // 切换当前筛选器
  activeFilters[filterType] = !activeFilters[filterType]
  
  // 显示对应的弹窗
  if (filterType === 'time' && activeFilters.time) {
    showTimePopup.value = true
    showFilterPopup.value = false
  } else if (filterType === 'filter' && activeFilters.filter) {
    showFilterPopup.value = true
    showTimePopup.value = false
  } else {
    showTimePopup.value = false
    showFilterPopup.value = false
  }
}

// 选择排序方式
const selectSort = (sortValue) => {
  currentSort.value = sortValue
  showTimePopup.value = false
  activeFilters.time = false
  
  // 重置并重新加载数据
  page.value = 1
  fetchLostFoundItems()
}

// 重置筛选条件
const resetFilters = () => {
  selectedCategory.value = 'all'
  selectedLocation.value = 'all'
  selectedTimePeriod.value = 'all'
  selectedStatus.value = 'all'
}

// 确认筛选条件
const confirmFilters = () => {
  showFilterPopup.value = false
  activeFilters.filter = false
  
  // 重置并重新加载数据
  page.value = 1
  fetchLostFoundItems()
}

// 查看详情
const viewDetail = (itemId) => {
  router.push(`/lostfound/${itemId}`)
}

// 跳转到失物招领发布页
const goToPublish = () => {
  router.push('/publish/lostfound')
}

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  
  // 今天的日期
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 昨天的日期
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 其他日期
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  fetchLostFoundItems()
})
</script>