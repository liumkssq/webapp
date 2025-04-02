<template>
  <div class="lost-found-list">
    <!-- 列表视图 -->
    <div class="list-container" v-if="!isLoading">
      <!-- 空状态 -->
      <div v-if="listData.list.length === 0" class="empty-state">
        <van-empty 
          description="暂无数据" 
          image="search"
        >
          <template #bottom>
            <van-button round type="primary" size="small" @click="handleEmptyAction">
              {{ activeTab === 'lost' ? '发布寻物启事' : activeTab === 'found' ? '发布招领启事' : '发布启事' }}
            </van-button>
          </template>
        </van-empty>
    </div>
    
    <!-- 列表内容 -->
      <div v-else class="items-grid">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loadingMore"
            :finished="isFinished"
            finished-text="没有更多了"
            @load="onLoadMore"
          >
            <!-- 物品卡片 -->
            <div 
              v-for="item in listData.list" 
        :key="item.id" 
        class="lost-found-item"
        @click="goToDetail(item.id)"
      >
              <div class="item-card">
                <!-- 图片区域 -->
                <div class="item-image-container">
                  <van-image
                    class="item-image"
                    :src="getFirstImage(item.images)"
                    fit="cover"
                    radius="8px 8px 0 0"
            @error="handleImageError"
          >
                    <template #error>
                      <div class="image-error">
                        <van-icon name="photo-o" size="24" />
        </div>
                    </template>
                    <template #loading>
                      <div class="image-loading">
                        <van-loading type="spinner" size="20" />
        </div>
                    </template>
                  </van-image>
                  
                  <!-- 类型标签 -->
                  <div 
                    class="item-type-tag" 
                    :class="{ 'found': item.type === 'found', 'lost': item.type === 'lost' }"
                  >
              {{ item.type === 'lost' ? '寻物' : '招领' }}
            </div>
          </div>
          
                <!-- 内容区域 -->
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-location">
                    <van-icon name="location-o" />
                    <span>{{ item.location || '未知地点' }}</span>
          </div>
          
                  <!-- 标签 -->
                  <div class="item-tags" v-if="item.tags && item.tags.length > 0">
                    <van-tag 
                      v-for="(tag, index) in getLimitedTags(item.tags)" 
                      :key="index"
                      plain
                      size="mini"
                      :type="getTagType(tag)"
                      class="tag-item"
                    >
                      {{ tag }}
                    </van-tag>
                    <span v-if="item.tags.length > 2" class="more-tag">+{{ item.tags.length - 2 }}</span>
          </div>
          
                  <!-- 底部信息 -->
                  <div class="item-footer">
                    <div class="publisher-info">
                      <van-image
                        class="publisher-avatar"
                        :src="item.publisherAvatar || 'https://img.yzcdn.cn/vant/cat.jpeg'"
                        fit="cover"
                        width="24"
                        height="24"
                        round
                      />
                      <span class="publisher-name">{{ item.publisherName || '匿名用户' }}</span>
            </div>
                    <div class="item-stats">
                      <span><van-icon name="eye-o" /> {{ item.viewCount || 0 }}</span>
                      <span><van-icon name="like-o" /> {{ item.likeCount || 0 }}</span>
                      <span><van-icon name="chat-o" /> {{ item.commentCount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    </div>
          </van-list>
        </van-pull-refresh>
    </div>
    </div>
    
    <!-- 加载中状态 -->
    <div v-else class="loading-state">
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, defineExpose, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'

const router = useRouter()

// 定义属性
const props = defineProps({
  defaultTab: {
    type: String,
    default: 'all'
  },
  showTabs: {
    type: Boolean,
    default: true
  },
  // 可以添加更多属性
})

// 定义事件
const emit = defineEmits(['tabChange', 'emptyAction', 'loading'])

// 状态变量
const activeTab = ref(props.defaultTab)
const isLoading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const isFinished = ref(false)

// 列表数据
const listData = ref({
  list: [],
  total: 0,
  page: 1,
  limit: 10
})

// 监听标签变化
watch(activeTab, (newValue) => {
  emit('tabChange', newValue)
})

// 更新列表数据
const updateListData = (data) => {
  if (refreshing.value) {
    // 下拉刷新时，替换数据
    listData.value = data
    refreshing.value = false
  } else if (loadingMore.value && currentPage.value > 1) {
    // 加载更多时，追加数据
    listData.value = {
      ...data,
      list: [...listData.value.list, ...data.list]
    }
    loadingMore.value = false
  } else {
    // 首次加载或切换标签时，替换数据
    listData.value = data
  }
  
  // 更新加载状态
  isLoading.value = false
  
  // 检查是否已加载全部数据
  if (listData.value.list.length >= listData.value.total) {
    isFinished.value = true
  } else {
    isFinished.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value !== tab) {
  activeTab.value = tab
    currentPage.value = 1
    isFinished.value = false
    refreshData()
  }
}

// 刷新数据
const refreshData = () => {
  isLoading.value = true
  currentPage.value = 1
  emit('loading', true)
}

// 下拉刷新
const onRefresh = () => {
  currentPage.value = 1
  isFinished.value = false
  emit('loading', true, { refresh: true })
}

// 加载更多
const onLoadMore = () => {
  if (isFinished.value) return
  
  currentPage.value += 1
  loadingMore.value = true
  
  // 通知父组件加载更多数据
  emit('loading', true, { 
    page: currentPage.value,
    limit: listData.value.limit
  })
}

// 空状态操作
const handleEmptyAction = () => {
  emit('emptyAction', activeTab.value)
}

// 跳转到详情页
const goToDetail = (id) => {
  console.log('正在跳转到详情页，原始ID:', id);
  
  // 确保ID是有效值
  let validId = id;
  
  // 如果是字符串，尝试转换为数字
  if (typeof id === 'string') {
    try {
      // 移除不必要的字符
      const cleanId = id.trim().replace(/[^\d]/g, '');
      validId = parseInt(cleanId, 10);
    } catch (e) {
      console.error('ID转换失败:', e);
    }
  } else if (typeof id === 'number') {
    validId = id;
  }
  
  // 验证ID是否有效
  if (isNaN(validId) || validId <= 0) {
    console.error('无效的ID:', id);
    Toast('无效的项目ID，无法查看详情');
    return;
  }
  
  // 记录处理后的ID
  console.log('处理后的ID:', validId);
  
  // 延迟一下导航，以确保UI响应
  setTimeout(() => {
    router.push(`/lost-found/detail/${validId}`);
  }, 50);
}

// 处理图片加载错误
const handleImageError = (e) => {
  // 设置默认图片
  if (e.target) {
    e.target.src = 'https://img01.yzcdn.cn/vant/apple-1.jpg'
  }
}

// 获取第一张图片
const getFirstImage = (images) => {
  if (!images || images.length === 0) {
    return 'https://img01.yzcdn.cn/vant/apple-1.jpg'
  }
  
  // 尝试解析JSON字符串
  let firstImage = images[0]
  if (typeof firstImage === 'string') {
    if (firstImage.startsWith('[')) {
      try {
        const parsed = JSON.parse(firstImage)
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : firstImage
      } catch (e) {
        console.warn('解析图片JSON失败:', e)
      }
    }
  }
  
  return firstImage || 'https://img01.yzcdn.cn/vant/apple-1.jpg'
}

// 限制标签数量
const getLimitedTags = (tags) => {
  if (!tags || !Array.isArray(tags)) return []
  return tags.slice(0, 2) // 最多显示2个标签
}

// 获取标签类型
const getTagType = (tag) => {
  const tagTypeMap = {
    '耳机': 'primary',
    '钱包': 'success',
    '手机': 'danger',
    '卡片': 'warning',
    '钥匙': 'primary'
  }
  
  return tagTypeMap[tag] || 'default'
}

// 暴露方法给父组件
defineExpose({
  switchTab,
  refresh: refreshData,
  updateListData
})

// 组件挂载时
onMounted(() => {
  // 通知父组件组件已挂载，需要加载数据
  emit('loading', true)
})
</script>

<style scoped>
.lost-found-list {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: transparent;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.list-container {
  padding-bottom: 10px;
}

.empty-state {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lost-found-item {
  width: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lost-found-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.item-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.item-image-container {
  position: relative;
  width: 100%;
  height: 180px;
}

.item-image {
  width: 100%;
  height: 100%;
}

.image-error,
.image-loading {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  color: #999;
}

.item-type-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.item-type-tag.found {
  background-color: #07c160;
}

.item-type-tag.lost {
  background-color: #ee0a24;
}

.item-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  color: #323233;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-location {
  font-size: 12px;
  color: #969799;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.tag-item {
  font-size: 10px;
}

.more-tag {
  font-size: 10px;
  color: #969799;
  display: inline-flex;
  align-items: center;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
  border-top: 0.5px solid #f2f2f2;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.publisher-avatar {
  flex-shrink: 0;
}

.publisher-name {
  font-size: 12px;
  color: #646566;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

.item-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #969799;
}

.item-stats span {
  display: flex;
  align-items: center;
  gap: 2px;
}

@media (prefers-color-scheme: dark) {
  .lost-found-item {
    background-color: #1c1c1e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .item-title {
    color: #f5f5f5;
  }
  
  .item-footer {
    border-top-color: #2c2c2e;
  }
  
  .image-error, 
  .image-loading {
    background-color: #2c2c2e;
    color: #8e8e93;
  }
}
</style>