<template>
  <div class="notifications-page">
    <HeaderNav title="通知中心">
      <template #right>
        <van-button
          plain
          hairline
          size="small"
          type="primary"
          @click="markAllRead"
          class="mark-all-read-button"
          :disabled="activeListHasNoUnread"
        >
          全部已读
        </van-button>
      </template>
    </HeaderNav>

    <van-tabs v-model:active="activeTab" sticky offset-top="46">
      <van-tab title="全部" name="all">
         <NotificationList ref="listAll" type="all" @update-counts="fetchUnreadCounts" />
      </van-tab>
      <van-tab name="interaction">
        <template #title>
          <van-badge :content="unreadCounts.interaction || 0" max="99">
            <span class="tab-title">互动</span>
          </van-badge>
        </template>
        <NotificationList ref="listInteraction" type="interaction" @update-counts="fetchUnreadCounts"/>
      </van-tab>
       <van-tab name="transaction">
         <template #title>
           <van-badge :content="unreadCounts.transaction || 0" max="99">
             <span class="tab-title">交易</span>
           </van-badge>
         </template>
         <NotificationList ref="listTransaction" type="transaction" @update-counts="fetchUnreadCounts"/>
      </van-tab>
       <van-tab name="lostfound">
         <template #title>
           <van-badge :content="unreadCounts.lostfound || 0" max="99">
             <span class="tab-title">失物招领</span>
           </van-badge>
         </template>
         <NotificationList ref="listLostFound" type="lostfound" @update-counts="fetchUnreadCounts"/>
      </van-tab>
      <van-tab name="system">
        <template #title>
          <van-badge :content="unreadCounts.system || 0" max="99">
            <span class="tab-title">系统</span>
          </van-badge>
        </template>
        <NotificationList ref="listSystem" type="system" @update-counts="fetchUnreadCounts"/>
      </van-tab>
    </van-tabs>

    <FooterNav />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Tabs as VanTabs, Tab as VanTab, Badge as VanBadge, Button as VanButton } from 'vant';
import HeaderNav from '@/components/HeaderNav.vue';
import FooterNav from '@/components/FooterNav.vue';
import NotificationList from '@/components/notification/NotificationList.vue';
import { getUnreadCount } from '@/api/notification'; // API 获取未读数

const activeTab = ref('all'); // 默认选中的标签页

// 用于存储各类未读消息数，需要从API获取
const unreadCounts = reactive({
  all: 0, // 总未读数，或者可以通过其他类型计算得出
  interaction: 0,
  transaction: 0,
  lostfound: 0,
  system: 0
});

// Refs to access child component methods
const listRefs = {
  all: ref(null),
  interaction: ref(null),
  transaction: ref(null),
  lostfound: ref(null),
  system: ref(null)
};

// 获取未读消息数
const fetchUnreadCounts = async () => {
  console.log("Fetching unread counts...");
  try {
    // 假设 API 返回格式 { code: 200, data: { count: 10, byType: { interaction: 5, transaction: 2, ... } } } 
    const response = await getUnreadCount();
    if (response.code === 200 && response.data) {
      const countsData = response.data;
      unreadCounts.all = countsData.count || 0;
      unreadCounts.interaction = countsData.byType?.interaction || 0;
      unreadCounts.transaction = countsData.byType?.transaction || 0;
      unreadCounts.lostfound = countsData.byType?.lostfound || 0;
      unreadCounts.system = countsData.byType?.system || 0;
      
      console.log('Unread counts updated:', JSON.parse(JSON.stringify(unreadCounts)));
    } else {
       console.warn('Failed to get unread counts:', response.message);
    }
  } catch (error) {
    console.error('Error fetching unread counts:', error);
  }
};

// 标记当前活动标签页下的所有通知为已读
const markAllRead = async () => {
  const currentListRef = listRefs[activeTab.value]?.value;
  if (currentListRef && typeof currentListRef.markAllRead === 'function') {
    const success = await currentListRef.markAllRead();
    if (success) {
      // 标记成功后，重新获取未读计数以更新 Badge
      await fetchUnreadCounts();
    }
  } else {
     console.warn('Could not find list component ref or markAllRead method for tab:', activeTab.value);
  }
};

// 计算当前激活的列表是否有未读消息（用于禁用"全部已读"按钮）
// 注意：这依赖于 unreadCounts 的准确性，或者 NotificationList 内部状态
// 简单的实现是检查 unreadCounts
const activeListHasNoUnread = computed(() => {
    // Check if the specific list exists and has unread items based on counts
    // The 'all' tab button should be enabled if *any* category has unread items
    if (activeTab.value === 'all') {
        return unreadCounts.all <= 0; // Disable if total unread is 0 or less
    } else {
        return unreadCounts[activeTab.value] <= 0; // Disable if category unread is 0 or less
    }
});


onMounted(() => {
  fetchUnreadCounts();
});

</script>

<style scoped>
.notifications-page {
  padding-top: 46px; /* HeaderNav height */
  padding-bottom: 50px; /* FooterNav height */
  min-height: 100vh;
  background-color: #f7f8fa;
}

.mark-all-read-button {
  color: var(--van-nav-bar-icon-color);
  border: none;
  padding: 0 8px;
  height: 28px;
}

/* Ensure tab content takes remaining height */
:deep(.van-tabs__content) {
  height: calc(100vh - 46px - 50px - 44px); /* viewport - header - footer - tabs_nav */
  overflow-y: auto;
}

.tab-title {
  padding: 0 4px; /* Add padding if badge content is 0 */
}

/* Style badge position if needed */
:deep(.van-badge) {
    /* Example: transform: translateY(-2px); */
}
</style>
