<template>
  <div class="lost-found-page">
    <!-- 头部导航 -->
    <header-nav title="失物招领" :showBack="false" />
    
    <!-- 选项卡 -->
    <div class="tab-container">
      <van-tabs v-model:active="activeTab" background="#f5f7fa" animated swipeable>
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="寻物" name="lost"></van-tab>
        <van-tab title="招领" name="found"></van-tab>
      </van-tabs>
    </div>
    
    <!-- 类别过滤 -->
    <div class="category-filter">
      <van-dropdown-menu>
        <van-dropdown-item v-model="activeCategoryId" :options="categoryOptions" />
        <van-dropdown-item v-model="activeStatus" :options="statusOptions" />
        <van-dropdown-item v-model="sortMethod" :options="sortOptions" />
      </van-dropdown-menu>
    </div>
    
    <!-- 失物招领列表 -->
    <div class="lost-found-container">
      <lost-found-list 
        ref="lostFoundListRef"
      :defaultTab="activeTab"
      @tabChange="handleTabChange"
        @loading="handleListLoading"
        @emptyAction="handleEmptyAction"
    />
    </div>
    
    <!-- 悬浮发布按钮 -->
    <FloatingBubble 
      class="publish-btn"
      icon="plus"
      color="#1989fa"
      @click="handlePublish"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Toast, Dialog, FloatingBubble } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';
import LostFoundList from '@/components/LostFoundList.vue';
import { getLostFoundList } from '@/api/lostFound';

const router = useRouter();

// 状态变量
const activeTab = ref('all');
const activeCategoryId = ref('all');
const activeStatus = ref('all');
const sortMethod = ref('latest');
const lostFoundListRef = ref(null);
const loading = ref(false);

// 失物招领数据
const lostFoundData = ref({
  list: [],
  total: 0,
  page: 1,
  limit: 10
});

// 类别选项
const categoryOptions = [
  { text: '全部类别', value: 'all' },
  { text: '电子产品', value: 'electronics' },
  { text: '书籍资料', value: 'books' },
  { text: '卡片证件', value: 'cards' },
  { text: '衣物饰品', value: 'clothing' },
  { text: '日常用品', value: 'daily' },
  { text: '其他物品', value: 'other' }
];

// 状态选项
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '处理中', value: 'pending' },
  { text: '已完成', value: 'completed' },
  { text: '已关闭', value: 'closed' }
];

// 排序选项
const sortOptions = [
  { text: '最新发布', value: 'latest' },
  { text: '最多浏览', value: 'most_viewed' },
  { text: '最多评论', value: 'most_commented' }
];

// 处理列表组件加载事件
const handleListLoading = (shouldLoad, options = {}) => {
  if (shouldLoad) {
    const { refresh = false, page } = options;
    if (refresh || page === 1) {
      fetchLostFoundList(true);
    } else if (page > 1) {
      // 加载更多数据
      lostFoundData.value.page = page;
      fetchLostFoundList(false);
    }
  }
};

// 处理标签切换
const handleTabChange = (tab) => {
  console.log('Tab changed:', tab);
  activeTab.value = tab;
  fetchLostFoundList(true, true);
};

// 处理数据加载
const handleLoading = async (data, isRefresh = false, total = null) => {
  if (!data) {
    console.error('数据为空');
    return;
  }
  
  // 处理数据
  const processedData = processListData(Array.isArray(data) ? data : []);
  
  // 如果有传入total，则使用传入的total
  if (total !== null) {
    processedData.total = total;
  }
  
  // 更新列表组件
  if (lostFoundListRef.value) {
    lostFoundListRef.value.updateListData(processedData);
  } else {
    console.error('列表组件引用不存在');
  }
  
  // 更新本地数据
  if (isRefresh) {
    lostFoundData.value = processedData;
  } else {
    // 合并数据
    lostFoundData.value = {
      ...processedData,
      list: [...lostFoundData.value.list, ...processedData.list]
    };
  }
  
  loading.value = false;
};

// 处理空状态操作
const handleEmptyAction = (tab) => {
  handlePublish(tab);
};

// 处理发布操作
const handlePublish = (type = activeTab.value) => {
  if (type === 'all') {
    // 显示选择发布类型的对话框
    Dialog.confirm({
      title: '发布启事',
      message: '请选择要发布的启事类型',
      showCancelButton: true,
      confirmButtonText: '招领启事',
      cancelButtonText: '寻物启事',
    })
      .then(() => {
        // 确认按钮 - 招领启事
        router.push('/lost-found/publish/found');
      })
      .catch(() => {
        // 取消按钮 - 寻物启事
        router.push('/lost-found/publish/lost');
      });
  } else {
    // 直接跳转到对应类型的发布页面
    router.push(`/lost-found/publish/${type}`);
  }
};

// 处理列表数据
const processListData = (data) => {
  if (!data || !Array.isArray(data)) {
    console.error('列表数据格式错误:', data);
    return {
      list: [],
      total: 0,
      page: 1,
      limit: 10
    };
  }
  
  // 处理列表数据
  const processedList = data.map(item => {
    const processedItem = { ...item };
    
    // 确保ID是有效的数字
    if (processedItem.id) {
      processedItem.id = parseInt(processedItem.id, 10);
      if (isNaN(processedItem.id)) {
        processedItem.id = Math.floor(Math.random() * 10000); // 生成随机ID作为后备
        console.warn('项目有无效ID，已生成随机ID:', processedItem.id);
      }
    } else {
      processedItem.id = Math.floor(Math.random() * 10000); // 生成随机ID
      console.warn('项目缺少ID，已生成随机ID:', processedItem.id);
    }
    
    // 处理空字段和特殊字符
    if (!processedItem.type || processedItem.type === '\u0000') {
      // 根据标题或描述推断类型
      if (processedItem.title && (
        processedItem.title.includes('找到') || 
        processedItem.title.includes('捡到') || 
        processedItem.title.includes('招领')
      )) {
        processedItem.type = 'found';
      } else {
        processedItem.type = 'lost';
      }
    }
    
    // 处理状态字段
    if (!processedItem.status || processedItem.status === '\u0000') {
      processedItem.status = 'pending';
    }
    
    // 处理分类字段
    if (!processedItem.category) {
      // 根据标题或描述推断分类
      const title = processedItem.title || '';
      const description = processedItem.description || '';
      const content = title + ' ' + description;
      
      if (content.match(/手机|电脑|耳机|充电宝|平板|相机|电子|数码/)) {
        processedItem.category = '电子产品';
      } else if (content.match(/书|笔记|课本|资料/)) {
        processedItem.category = '书籍资料';
      } else if (content.match(/卡|证|证件|学生证|身份证|校园卡/)) {
        processedItem.category = '卡片证件';
      } else if (content.match(/衣|裤|鞋|帽|包|伞|手表|眼镜/)) {
        processedItem.category = '衣物饰品';
      } else if (content.match(/水杯|餐具|钥匙|文具/)) {
        processedItem.category = '日常用品';
      } else {
        processedItem.category = '其他物品';
      }
    }
    
    // 处理图片字段
    if (processedItem.images) {
      // 如果images是字符串，尝试解析JSON
      if (typeof processedItem.images === 'string') {
        try {
          if (processedItem.images.startsWith('[')) {
            processedItem.images = JSON.parse(processedItem.images);
          } else {
            processedItem.images = [processedItem.images];
          }
        } catch (e) {
          console.error('解析图片JSON失败:', e);
          processedItem.images = [processedItem.images];
        }
      } else if (!Array.isArray(processedItem.images)) {
        processedItem.images = [processedItem.images];
      }
    } else {
      // 设置默认图片
      processedItem.images = [`https://picsum.photos/id/${(processedItem.id % 30) + 1}/300/300`];
    }
    
    // 生成标签
    if (!processedItem.tags || !Array.isArray(processedItem.tags) || processedItem.tags.length === 0) {
      const tags = [];
      
      // 根据分类添加标签
      if (processedItem.category) {
        tags.push(processedItem.category);
      }
      
      // 根据描述添加相关标签
      const content = (processedItem.title || '') + ' ' + (processedItem.description || '');
      
      if (content.includes('耳机')) tags.push('耳机');
      if (content.includes('手机')) tags.push('手机');
      if (content.includes('钱包')) tags.push('钱包');
      if (content.includes('钥匙')) tags.push('钥匙');
      if (content.includes('卡')) tags.push('卡片');
      
      processedItem.tags = tags.slice(0, 3); // 最多3个标签
    }
    
    return processedItem;
  });
  
  console.log('处理后的列表数据:', processedList);
  
  return {
    list: processedList,
    total: data.length,
    page: lostFoundData.value.page,
    limit: lostFoundData.value.limit
  };
};

// 获取失物招领列表数据
const fetchLostFoundList = async (isRefresh = false, tabChanged = false) => {
  if (isRefresh || tabChanged) {
    lostFoundData.value.page = 1;
    lostFoundData.value.list = [];
  }

  const params = {
    page: lostFoundData.value.page,
    limit: lostFoundData.value.limit,
    type: activeTab.value === 'all' ? '' : activeTab.value
  };

  loading.value = true;
  try {
    console.log('Fetching lost found list with params:', params);
    const response = await getLostFoundList(params);
    console.log('API Response:', response);
    
    // 检查响应数据格式
    if (response) {
      // 优先检查response.data.list
      if (response.data && response.data.list && Array.isArray(response.data.list)) {
        console.log('处理response.data.list格式数据');
        handleLoading(response.data.list, isRefresh, response.data.total);
        return;
      }
      
      // 检查response.list (API直接返回了对象)
      if (response.list && Array.isArray(response.list)) {
        console.log('处理response.list格式数据');
        handleLoading(response.list, isRefresh, response.total);
        return;
      }
      
      // 检查response.data (如果是数组)
      if (response.data && Array.isArray(response.data)) {
        console.log('处理response.data数组格式数据');
        handleLoading(response.data, isRefresh);
        return;
      }
      
      // 如果response本身是数组
      if (Array.isArray(response)) {
        console.log('处理response数组格式数据');
        handleLoading(response, isRefresh);
        return;
      }
      
      console.warn('未识别的响应格式，尝试检查更深层结构', response);
      // 最后尝试查找任何可能的数组数据
      for (const key in response) {
        if (response[key] && Array.isArray(response[key])) {
          console.log(`找到数组数据在 response.${key}`);
          handleLoading(response[key], isRefresh);
          return;
        }
        
        if (response[key] && typeof response[key] === 'object' && response[key].list && Array.isArray(response[key].list)) {
          console.log(`找到数组数据在 response.${key}.list`);
          handleLoading(response[key].list, isRefresh, response[key].total);
          return;
        }
      }
      
      console.error('未能找到有效的列表数据:', response);
    }
    
    console.error('无法处理的响应格式:', response);
    loadMockData(isRefresh);
  } catch (error) {
    console.error('Failed to fetch lost found list:', error);
    loadMockData(isRefresh);
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据 - 仅用于开发阶段
const generateMockData = (count) => {
  const types = ['lost', 'found'];
  const categories = ['电子产品', '书籍资料', '卡片证件', '衣物饰品', '日常用品', '其他物品'];
  const statuses = ['pending', 'completed', 'closed'];
  const locations = ['图书馆', '教学楼', '宿舍', '食堂', '操场', '其他地点'];
  const titles = [
    '捡到耳机',
    '丢失钱包急寻',
    '遗失一张学生卡',
    '在食堂捡到手机',
    '丢失笔记本电脑',
    '丢失眼镜',
    '捡到钥匙',
    '丢失蓝牙音箱',
    '捡到一件外套',
    '丢失银行卡'
  ];
  
  return Array.from({ length: count }).map((_, index) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const title = titles[index % titles.length];
    const isLost = type === 'lost';
    
    return {
      id: index + 1,
      title: isLost ? title.replace('捡到', '丢失') : title.replace('丢失', '捡到'),
      description: `${isLost ? '我在校园内丢失了' : '我在校园内捡到了'}${title.replace('捡到', '').replace('丢失', '').replace('急寻', '')}，${isLost ? '希望好心人看到能够联系我' : '失主请尽快联系我认领'}。`,
      type,
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      lostFoundTime: new Date(Date.now() - Math.random() * 604800000).toISOString(), // 随机7天内的时间
      contactInfo: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      publisherId: index + 100,
      publisherName: `用户${index + 100}`,
      publisherAvatar: `https://i.pravatar.cc/100?img=${(index % 70) + 1}`,
      images: [`https://picsum.photos/id/${(index % 30) + 1}/300/300`],
      tags: [categories[Math.floor(Math.random() * categories.length)], isLost ? '急寻' : '待认领'],
      viewCount: Math.floor(Math.random() * 100),
      likeCount: Math.floor(Math.random() * 20),
      commentCount: Math.floor(Math.random() * 10),
      createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString() // 随机7天内的时间
    };
  });
};

// 加载模拟数据
const loadMockData = (isRefresh = false) => {
  console.log('加载模拟数据');
  // 生成模拟数据
  const mockData = generateMockData(10);
  // 处理模拟数据
  const processedData = processListData(mockData);
  // 更新列表数据
  handleLoading(processedData.list, isRefresh, processedData.total);
};

// 监听筛选条件变化
watch([activeCategoryId, activeStatus, sortMethod], () => {
  fetchLostFoundList(1, true);
});

// 组件挂载时执行
onMounted(() => {
  console.log('失物招领列表页面挂载');
  fetchLostFoundList(true);
});

// 组件激活时执行
onActivated(() => {
  console.log('失物招领列表页面激活');
  // 当从详情页返回列表页时，刷新列表
  if (lostFoundListRef.value) {
    lostFoundListRef.value.refresh();
    fetchLostFoundList(true);
  }
});
</script>

<style scoped>
.lost-found-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.tab-container {
  position: sticky;
  top: 0;
  z-index: 2;
}

.category-filter {
  position: sticky;
  top: 44px;
  z-index: 1;
  background-color: #ffffff;
}

.lost-found-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  padding-bottom: 80px;
}

.publish-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 10;
  width: 56px;
  height: 56px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .lost-found-page {
    background-color: #121212;
  }
  
  .category-filter {
    background-color: #1c1c1e;
  }
}
</style>