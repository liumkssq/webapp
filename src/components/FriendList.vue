<template>
  <div class="friend-list">
    <!-- 搜索框 -->
    <div class="search-bar">
      <van-search
        v-model="searchKey"
        placeholder="搜索好友"
        shape="round"
        clearable
      />
    </div>
    
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#1989fa" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 无好友状态 -->
    <div v-else-if="filteredFriends.length === 0" class="empty-container">
      <van-empty
        image="search"
        :description="searchKey ? '未找到匹配的好友' : '还没有好友，快去添加吧'"
      >
        <template v-if="!searchKey" #bottom>
          <van-button
            round
            type="primary"
            size="small"
            @click="$emit('add-friend')"
          >
            添加好友
          </van-button>
        </template>
      </van-empty>
    </div>
    
    <!-- 好友列表 -->
    <div v-else class="list-container">
      <van-index-bar :sticky="false" :index-list="indexList">
        <div v-for="(group, key) in groupedFriends" :key="key">
          <van-index-anchor :index="key" />
          <van-cell-group>
            <van-cell
              v-for="friend in group"
              :key="friend.id"
              :title="friend.name || friend.nickname"
              :label="friend.signature || '这个人很懒，什么都没留下'"
              clickable
              @click="$emit('select-friend', friend)"
            >
              <!-- 好友头像 -->
              <template #icon>
                <div class="friend-avatar">
                  <van-image
                    round
                    fit="cover"
                    :src="friend.avatar || '/img/default-avatar.png'"
                    width="40"
                    height="40"
                  >
                    <template #error>
                      <van-icon name="user-circle-o" size="40" />
                    </template>
                  </van-image>
                  <div 
                    class="status-dot" 
                    :class="{'online': friend.online, 'offline': !friend.online}"
                  ></div>
                </div>
              </template>
              
              <!-- 操作按钮 -->
              <template #right-icon>
                <van-button
                  type="primary"
                  size="small"
                  icon="chat-o"
                  plain
                  round
                  class="action-button"
                  @click.stop="$emit('chat', friend)"
                >
                  聊天
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-index-bar>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

// 定义组件属性
const props = defineProps({
  friends: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 定义组件事件
const emit = defineEmits(['select-friend', 'chat', 'add-friend']);

// 搜索关键词
const searchKey = ref('');

// 过滤后的好友列表
const filteredFriends = computed(() => {
  if (!searchKey.value) return props.friends;
  
  const key = searchKey.value.toLowerCase();
  return props.friends.filter(friend => {
    const name = (friend.name || friend.nickname || '').toLowerCase();
    const signature = (friend.signature || '').toLowerCase();
    return name.includes(key) || signature.includes(key);
  });
});

// 按拼音首字母分组的好友列表
const groupedFriends = computed(() => {
  const result = {};
  
  filteredFriends.value.forEach(friend => {
    // 获取用户名首字母
    const name = friend.name || friend.nickname || '';
    const initial = name.charAt(0).toUpperCase();
    
    // 如果是字母，放入对应分组
    if (/[A-Z]/.test(initial)) {
      if (!result[initial]) {
        result[initial] = [];
      }
      result[initial].push(friend);
    } else {
      // 非字母开头，统一放入 # 分组
      if (!result['#']) {
        result['#'] = [];
      }
      result['#'].push(friend);
    }
  });
  
  // 对每个分组内的好友按名称排序
  Object.keys(result).forEach(key => {
    result[key].sort((a, b) => {
      const nameA = (a.name || a.nickname || '').toLowerCase();
      const nameB = (b.name || b.nickname || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });
  
  return result;
});

// 索引列表
const indexList = computed(() => {
  const keys = Object.keys(groupedFriends.value).sort();
  
  // 将 # 移到最后
  if (keys.includes('#')) {
    keys.splice(keys.indexOf('#'), 1);
    keys.push('#');
  }
  
  return keys;
});
</script>

<style scoped>
.friend-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 8px 0;
  background-color: #fff;
}

.loading-container,
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}

.friend-avatar {
  position: relative;
  margin-right: 12px;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.online {
  background-color: #07c160;
}

.offline {
  background-color: #969799;
}

.action-button {
  margin-left: 8px;
}
</style> 