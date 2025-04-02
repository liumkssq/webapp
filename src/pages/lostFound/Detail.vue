<template>
  <div class="lost-found-detail-page">
    <!-- iOS风格导航栏 -->
    <HeaderNav 
      :title="item.type === 'lost' ? '寻物启事' : '招领启事'" 
      left-arrow 
      @click-left="router.back()"
      fixed
      placeholder
      border
    >
      <template #right>
        <van-icon name="share-o" size="18" @click="handleShare" />
      </template>
    </HeaderNav>
    
    <!-- 主内容区域 -->
    <div class="detail-container">
      <!-- 加载状态 -->
      <van-skeleton v-if="loading" title avatar :row="10" />

      <template v-else>
        <!-- 物品图片区域 -->
        <div class="image-wrapper">
          <van-swipe
            class="image-swiper"
            :autoplay="3000"
            indicator-color="#007aff"
          >
            <van-swipe-item v-if="item.images && item.images.length">
              <van-image
                :src="item.images[0]"
                width="100%"
                height="230"
                radius="8px 8px 0 0"
                fit="cover"
                @error="handleImageError"
              />
            </van-swipe-item>
            <van-swipe-item v-else>
              <van-image
                src="https://img01.yzcdn.cn/vant/apple-1.jpg"
                width="100%"
                height="230"
                radius="8px 8px 0 0"
                fit="cover"
              />
            </van-swipe-item>
          </van-swipe>
        </div>

        <!-- 物品基本信息卡片 -->
        <van-cell-group inset class="card-style">
          <!-- 标题与类型 -->
          <van-cell class="title-cell">
            <template #title>
              <div class="title-row">
                <van-tag
                  :type="item.type === 'lost' ? 'danger' : 'success'"
                  size="medium"
                  class="mr-8"
                >
                  {{ item.type === 'lost' ? '寻物' : '招领' }}
                </van-tag>
                <span class="item-title">{{ item.title || '无标题' }}</span>
              </div>
            </template>
          </van-cell>
          
          <!-- 描述信息 -->
          <van-cell>
            <template #label>
              <div class="description-text">{{ item.description || '暂无描述' }}</div>
            </template>
          </van-cell>

          <!-- 地点和联系方式 -->
          <van-cell title="拾获地点" icon="location-o" v-if="item.location">
            <template #value>{{ item.location }}</template>
          </van-cell>
          <van-cell title="联系方式" icon="phone-o" v-if="item.contactInfo">
            <template #value>{{ item.contactInfo }}</template>
          </van-cell>
          <van-cell title="发布时间" icon="clock-o">
            <template #value>{{ formatTimeAgo(item.createdAt) }}</template>
          </van-cell>
          <van-cell title="浏览次数" icon="eye-o">
            <template #value>{{ item.viewCount || 0 }}</template>
          </van-cell>
        </van-cell-group>

        <!-- 发布者信息卡片 -->
        <van-cell-group inset class="card-style">
          <van-cell title="发布者信息" icon="manager-o" />
          <van-cell class="publisher-cell">
            <template #default>
              <div class="publisher-info">
                <van-image
                  round
                  width="48"
                  height="48"
                  :src="item.publisherAvatar || 'https://img.yzcdn.cn/vant/cat.jpeg'"
                  @error="handleAvatarError"
                  class="publisher-avatar"
                />
                <div class="publisher-details">
                  <div class="publisher-name">{{ item.publisherName || '未知用户' }}</div>
                  <div class="publish-time text-gray">{{ formatTimeAgo(item.createdAt) }} 发布</div>
                </div>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
        
        <!-- 快捷操作按钮 -->
        <div class="primary-action">
          <van-button type="primary" size="large" round block @click="handlePrimaryAction">
            <template #icon><van-icon name="phone-o" /></template>
            {{ getPrimaryActionText }}
          </van-button>
        </div>
        
        <!-- 操作按钮组 -->
        <van-grid :column-num="3" :border="false" class="action-grid">
          <van-grid-item icon="share-o" text="分享" @click="handleShare" />
          <van-grid-item :icon="isFavorite ? 'star' : 'star-o'" 
                       :text="isFavorite ? '已收藏' : '收藏'" 
                       :class="{'favorite-active': isFavorite}"
                       @click="handleFavorite" />
          <van-grid-item icon="warning-o" text="举报" @click="handleReport" />
        </van-grid>
        
        <!-- 评论区 -->
        <van-cell-group inset class="card-style comments-section" v-if="!loadingComments">
          <van-cell title="评论" icon="chat-o">
            <template #value>
              <span class="comment-count">{{ item.commentCount || 0 }}</span>
            </template>
            <template #right-icon>
              <van-icon name="replay" @click="refreshComments" :class="{loading: loadingComments}" />
            </template>
          </van-cell>
          
          <!-- 评论输入框 -->
          <van-field
            v-model="commentContent"
            rows="1"
            autosize
            type="textarea"
            placeholder="写下你的评论..."
            :disabled="submittingComment"
            class="comment-input"
          >
            <template #button>
              <van-button size="small" type="primary" round @click="submitComment" :loading="submittingComment">发送</van-button>
            </template>
          </van-field>
          
          <!-- 空评论提示 -->
          <div v-if="!comments.length" class="empty-comment">
            <van-empty description="暂无评论" />
          </div>
          
          <!-- 评论列表 -->
          <div v-else>
            <van-cell 
              v-for="(comment, index) in comments" 
              :key="comment.id"
              class="comment-item"
              :class="{'comment-last': index === comments.length - 1}"
            >
              <div class="comment-header">
                <van-image
                  round
                  width="36"
                  height="36"
                  :src="comment.author?.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg'"
                  @error="handleAvatarError"
                />
                <div class="comment-author">
                  <div class="author-name">{{ comment.author?.name || '匿名用户' }}</div>
                  <div class="comment-time">{{ formatTimeAgo(comment.createTime) }}</div>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </van-cell>
          </div>
        </van-cell-group>
        
        <!-- 评论区加载中 -->
        <van-cell-group inset class="card-style" v-else>
          <van-cell title="评论" icon="chat-o" />
          <van-skeleton title avatar row="3" />
        </van-cell-group>
      </template>
    </div>
    
    <!-- 状态更新弹窗 -->
    <van-dialog
      v-model:show="showStatusUpdatePopup"
      title="更新物品状态"
      show-cancel-button
      @confirm="updateItemStatus"
    >
      <div class="dialog-content">
        <van-radio-group v-model="newStatus">
          <van-cell-group inset>
            <van-cell clickable @click="newStatus = 'pending'">
              <template #title>
                <van-radio name="pending">未找到/未认领</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="newStatus = 'completed'">
              <template #title>
                <van-radio name="completed">已找到/已认领</van-radio>
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
      </div>
    </van-dialog>

    <!-- 举报对话框 -->
    <van-dialog
      v-model:show="showReportDialog"
      title="举报内容"
      show-cancel-button
      @confirm="submitReport"
      confirm-button-color="#ee0a24"
    >
      <div class="dialog-content">
        <p class="dialog-subtitle">请选择举报原因：</p>
        <van-radio-group v-model="reportReason">
          <van-cell-group inset>
            <van-cell clickable @click="reportReason = 'fake'">
              <template #title>
                <van-radio name="fake">虚假信息</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'spam'">
              <template #title>
                <van-radio name="spam">广告/垃圾信息</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'rights'">
              <template #title>
                <van-radio name="rights">侵犯权益</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'illegal'">
              <template #title>
                <van-radio name="illegal">违法违规</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'other'">
              <template #title>
                <van-radio name="other">其他原因</van-radio>
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
        
        <van-field
          v-if="reportReason === 'other'"
          v-model="reportDetail"
          rows="3"
          autosize
          type="textarea"
          maxlength="200"
          placeholder="请详细说明原因"
          show-word-limit
          class="report-detail"
        />
      </div>
    </van-dialog>
    
    <!-- 分享操作表 -->
    <van-share-sheet
      v-model:show="showSharePopup"
      title="分享给好友"
      :options="shareOptions"
      @select="onShareSelect"
    />
  </div>
</template>

<script setup>
import '@/style/loading.css' // 引入加载样式
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getLostFoundDetail, updateLostFoundStatus, commentLostFound, likeLostFound, unlikeLostFound } from '@/api/lostFound'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
// 导入Vant组件
import { Dialog, Button, Cell, CellGroup, Image as VanImage, Divider, Field, RadioGroup, Radio, Tag, Icon, Toast, Empty, Grid, GridItem, Swipe, SwipeItem, ShareSheet, Skeleton } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const item = ref({})
const comments = ref([]) // 初始化为空数组
const loading = ref(true)
const loadingStatus = ref('加载中...')
const loadingError = ref(false)
const currentImageIndex = ref(0) // 当前显示的图片索引
const autoPlayTimer = ref(null) // 自动播放定时器
const commentText = ref('')
const replyTo = ref(null)
const showCommentInput = ref(false)
const showImagePreview = ref(false)
const previewSrc = ref('')
const showSharePopup = ref(false)
const showStatusUpdatePopup = ref(false)
const showReportDialog = ref(false)
const newStatus = ref('pending')
const toast = reactive({
  show: false,
  message: ''
})

// 举报相关
const reportReason = ref('fake');
const reportDetail = ref('');

// 与联系相关的操作
const commentContent = ref('');
const loadingComments = ref(false);
const submittingComment = ref(false);
const isFavorite = ref(false);

// 分享选项
const shareOptions = [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  { name: 'QQ', icon: 'qq' },
  { name: '复制链接', icon: 'link' }
];

// 主要操作按钮文本
const getPrimaryActionText = computed(() => {
  // 如果当前用户是发布者
  if (isCurrentUser.value) {
    return '修改状态';
  }
  
  // 如果是寻物启事
  if (item.value.type === 'lost') {
    return '我捡到了';
  }
  
  // 如果是招领启事
  if (item.value.type === 'found') {
    return '是我的物品';
  }
  
  return '联系发布者';
});

// 主要操作按钮点击事件
const handlePrimaryAction = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  // 如果当前用户是发布者
  if (isCurrentUser.value) {
    showStatusUpdatePopup.value = true;
    return;
  }
  
  // 非发布者，直接联系发布者
  contactPublisher();
};

// 处理收藏
const handleFavorite = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  isFavorite.value = !isFavorite.value;
  const message = isFavorite.value ? '已收藏' : '已取消收藏';
  showToast(message);
  
  // 后续可调用实际API保存收藏状态
};

// 处理举报
const handleReport = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  showReportDialog.value = true;
};

// 处理分享
const handleShare = () => {
  const shareData = {
    title: item.value.title || '失物招领',
    text: item.value.description || '查看详情',
    url: window.location.href
  };
  
  if (navigator.share && navigator.canShare(shareData)) {
    navigator.share(shareData)
      .then(() => console.log('分享成功'))
      .catch(err => {
        console.error('分享失败:', err);
        showToast('链接已复制到剪贴板');
      });
  } else {
    // 回退到复制链接
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('链接已复制到剪贴板'))
      .catch(() => showToast('复制失败，请手动复制链接'));
  }
};

// 刷新评论
const refreshComments = async () => {
  if (loadingComments.value) return;
  
  loadingComments.value = true;
  
  try {
    const id = route.params.id;
    // 这里应该调用获取评论的API
    // const response = await getLostFoundComments(id);
    
    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟空评论
    comments.value = [];
    
    loadingComments.value = false;
  } catch (error) {
    console.error('获取评论失败:', error);
    showToast('获取评论失败，请稍后再试');
    loadingComments.value = false;
  }
};

// 提交评论
const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  if (!commentContent.value.trim() || submittingComment.value) {
    return;
  }
  
  submittingComment.value = true;
  
  try {
    const id = route.params.id;
    const data = {
      content: commentContent.value.trim()
    };
    
    // 这里应该调用提交评论的API
    // const response = await commentLostFound(id, data);
    
    // 模拟API响应
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 成功后清空评论内容
    commentContent.value = '';
    
    // 添加一条模拟评论到列表
    const newComment = {
      id: Date.now(),
      content: data.content,
      createTime: new Date().toISOString(),
      author: {
        id: userStore.userId,
        name: userStore.nickname || '当前用户',
        avatar: userStore.avatar || getDefaultAvatar()
      }
    };
    
    comments.value = [newComment, ...comments.value];
    
    // 更新评论计数
    if (item.value.commentCount !== undefined) {
      item.value.commentCount++;
    } else {
      item.value.commentCount = 1;
    }
    
    showToast('评论成功');
  } catch (error) {
    console.error('提交评论失败:', error);
    showToast('评论失败，请稍后再试');
  } finally {
    submittingComment.value = false;
  }
};

// 计算当前用户是否是发布者
const isCurrentUser = computed(() => {
  return item.value.publisher && item.value.publisher.id === userStore.userId
})

// 生成相关物品的数据
const generateRelatedItems = () => {
  if (!item.value || !item.value.category) return []
  
  // 根据当前物品的分类和类型生成不同的相关物品
  const mockId = parseInt(route.params.id) || 30
  return Array(3).fill().map((_, i) => ({
    id: mockId + 200 + i,
    title: `${item.value.type === 'lost' ? '已招领' : '已丢失'}的${item.value.category} ${i+1}`,
    type: item.value.type === 'lost' ? 'found' : 'lost',
    status: ['pending', 'claimed', 'found'][Math.floor(Math.random() * 3)],
    location: ['教学楼', '图书馆', '食堂', '宿舍区'][Math.floor(Math.random() * 4)],
    eventTime: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
    images: [`https://picsum.photos/id/${(mockId % 30) + i + 80}/300/300`]
  }))
}

// 计算状态文本和样式
const statusText = computed(() => {
  return getStatusText(item.value.status)
})

const statusClass = computed(() => {
  return getStatusClass(item.value.status)
})

// 可用的状态选项
const availableStatuses = computed(() => {
  if (item.value.type === 'lost') {
    return [
      { value: 'pending', label: '寻找中' },
      { value: 'found', label: '已找到' },
      { value: 'closed', label: '关闭' }
    ]
  } else {
    return [
      { value: 'pending', label: '等待认领' },
      { value: 'claimed', label: '已认领' },
      { value: 'closed', label: '已关闭' }
    ]
  }
})

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: item.value.type === 'lost' ? '寻找中' : '等待认领',
    found: '已找到',
    claimed: '已认领',
    closed: '已关闭'
  }
  
  return statusMap[status] || '未知状态'
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    pending: 'status-pending',
    found: 'status-success',
    claimed: 'status-success',
    closed: 'status-closed'
  }
  
  return statusMap[status] || 'status-pending'
}

// 格式化时间为"几小时前"、"几天前"等形式
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '未知时间';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date; // 毫秒差
  
  // 小于24小时显示几小时前
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000));
      if (minutes === 0) {
        return '刚刚';
      }
      return `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  }
  
  // 小于一周显示几天前
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }
  
  // 否则显示具体日期
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 格式化日期显示
const formatDate = (timestamp) => {
  if (!timestamp) return '未知日期';
  
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 生成模拟数据
const generateMockData = (id) => {
  const mockId = parseInt(id) || 30;
  return {
    id: mockId,
    title: `模拟失物招领 ${mockId}`,
    description: `这是一个模拟失物招领详情，用于在无法获取真实数据时显示。这个物品具有特点是尺寸适中，形状规整，能够轻松识别。`,
    type: mockId % 2 === 0 ? 'lost' : 'found',
    status: ['pending', 'found', 'claimed', 'closed'][Math.floor(Math.random() * 4)],
    category: ['数码产品', '证件钱包', '生活用品', '图书教材', '其他物品'][Math.floor(Math.random() * 5)],
    location: ['教学楼A区', '图书馆', '食堂广场', '宿舍楼B栋', '校园南门'][Math.floor(Math.random() * 5)],
    eventTime: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString(),
    createTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
    images: [
      `https://picsum.photos/id/${(mockId % 30) + 1}/600/600`,
      `https://picsum.photos/id/${(mockId % 30) + 10}/600/600`,
      `https://picsum.photos/id/${(mockId % 30) + 20}/600/600`
    ],
    reward: mockId % 2 === 0 ? Math.floor(Math.random() * 50) + 5 : null,
    viewCount: Math.floor(Math.random() * 500) + 50,
    commentCount: Math.floor(Math.random() * 20) + 1,
    likes: Math.floor(Math.random() * 30) + 5,
    isLiked: false,
    publisher: {
      id: 1001,
      name: `模拟用户_${Math.floor(Math.random() * 100)}`,
      avatar: `https://picsum.photos/id/${mockId + 50}/100/100`,
      school: '华南理工大学',
      verified: Math.random() > 0.5,
      level: Math.floor(Math.random() * 6) + 1,
      joinDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000).toISOString()
    },
    contactInfo: {
      phone: `1${Math.floor(Math.random() * 9 + 1)}${Math.floor(Math.random() * 10000000000)}`.substring(0, 11),
      showPhone: true,
      wechat: `wx_user_${Math.floor(Math.random() * 10000)}`,
      showWechat: true
    },
    comments: Array(5).fill().map((_, i) => ({
      id: i + 1,
      content: `这是一条测试留言 ${i+1}，希望能尽快找到/物归原主！`,
      createTime: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
      likeCount: Math.floor(Math.random() * 10),
      isLiked: false,
      author: {
        id: 2000 + i,
        name: `评论用户_${i+1}`,
        avatar: `https://picsum.photos/id/${100 + i}/100/100`
      },
      replies: i === 0 ? [
        {
          id: 101,
          content: '感谢留言，我会继续寻找/等待认领',
          createTime: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000).toISOString(),
          author: {
            id: 1001,
            name: '发布者回复',
            avatar: `https://picsum.photos/id/${mockId + 50}/100/100`
          },
          replyTo: {
            id: 2000,
            name: '评论用户_1'
          }
        }
      ] : []
    })),
    similarItems: Array(4).fill().map((_, i) => ({
      id: mockId + 100 + i,
      title: `相似${mockId % 2 === 0 ? '丢失' : '拾获'}物品 ${i+1}`,
      type: mockId % 2 === 0 ? 'lost' : 'found',
      status: ['pending', 'found', 'claimed'][Math.floor(Math.random() * 3)],
      location: ['教学楼', '图书馆', '食堂', '宿舍楼'][Math.floor(Math.random() * 4)],
      eventTime: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
      images: [`https://picsum.photos/id/${(mockId % 20) + i + 40}/300/300`]
    }))
  };
};

// 解析评论数据
const processComments = (data) => {
  if (!data || !data.comments) return [];
  
  let commentData = data.comments;
  
  // 如果comments是字符串，尝试解析JSON
  if (typeof commentData === 'string') {
    try {
      commentData = JSON.parse(commentData);
    } catch (e) {
      console.error('解析评论数据失败:', e);
      commentData = [];
    }
  }
  
  // 如果不是数组，返回空数组
  if (!Array.isArray(commentData)) {
    return [];
  }
  
  // 处理每个评论的数据
  return commentData.map(comment => {
    // 确保评论有正确的结构
    const processedComment = {
      id: comment.id || Math.random().toString(36).substr(2, 9),
      content: comment.content || '',
      createTime: comment.createTime || new Date().toISOString(),
      user: {
        id: comment.user?.id || comment.userId || 0,
        nickname: comment.user?.nickname || comment.userName || '匿名用户',
        avatar: comment.user?.avatar || comment.userAvatar || '/images/default-avatar.jpg'
      },
      replies: []
    };
    
    // 处理回复
    if (comment.replies) {
      try {
        // 如果回复是字符串，尝试解析
        if (typeof comment.replies === 'string') {
          processedComment.replies = JSON.parse(comment.replies);
        } else if (Array.isArray(comment.replies)) {
          processedComment.replies = comment.replies;
        }
      } catch (e) {
        console.error('解析回复数据失败:', e);
        processedComment.replies = [];
      }
    }
    
    return processedComment;
  });
};

// 相关物品
const relatedItems = ref([]);

// 获取物品数据
const fetchItemDetail = async () => {
  loading.value = true;
  
  try {
    const id = route.params.id;
    console.log('获取物品详情，ID:', id);
    
    // 调用API获取物品详情
    const response = await getLostFoundDetail(id);
    console.log('物品详情API响应:', response);
    
    if (response && (response.code === 200 || response.success)) {
      if (response.data) {
        // 使用API返回的数据更新物品信息
        item.value = {
          ...response.data,
          // 确保images是数组
          images: ensureArray(response.data.images)
        };
        
        // 初始化评论
        if (!item.value.comments) {
          item.value.comments = [];
        }
        
        loading.value = false;
      } else {
        console.error('API返回的数据为空');
        showError('获取物品详情失败，返回数据为空');
      }
    } else {
      console.error('获取物品详情失败:', response);
      showError('获取物品详情失败，请稍后重试');
    }
  } catch (error) {
    console.error('获取物品详情异常:', error);
    showError('获取物品详情出错，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 确保是数组的辅助函数
const ensureArray = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      return [value];
    }
  }
  return Array.isArray(value) ? value : [value];
};

// 切换关注状态
const toggleFollow = async () => {
  console.log('toggleFollow clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  // 在真实环境中应调用对应的API
  // 这里仅做前端模拟
  item.value.isFollowed = !item.value.isFollowed
  showToast(item.value.isFollowed ? '关注成功' : '已取消关注')
}

// 联系发布者
const contactPublisher = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  if (item.value && item.value.publisherId) {
    // 跳转到聊天页面
    router.push(`/im/chat/${item.value.publisherId}`);
  } else if (item.value && item.value.contactInfo) {
    // 如果有联系信息，显示提示
    showToast(`联系方式: ${item.value.contactInfo}`);
  } else {
    showToast('无法获取联系方式');
  }
};

// 拨打电话
const callPhone = (phone) => {
  window.location.href = `tel:${phone}`
}

// 复制微信号
const copyWechat = (wechat) => {
  navigator.clipboard.writeText(wechat).then(
    () => {
      showToast('微信号已复制')
    },
    () => {
      showToast('复制失败，请手动复制')
    }
  )
}

// 跳转到聊天页面
const goToChat = (userId) => {
  router.push(`/chat/${userId}`)
}

// 更新物品状态
const updateItemStatus = async () => {
  try {
    // 这里添加实际API调用
    // await updateLostFoundStatus(route.params.id, newStatus.value);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    item.value.status = newStatus.value;
    showStatusUpdatePopup.value = false;
    showToast('状态已更新');
  } catch (error) {
    console.error('更新状态失败:', error);
    showToast('更新状态失败，请重试');
  }
}

// 显示留言框
const showComment = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  showCommentInput.value = true
  replyTo.value = null
  
  nextTick(() => {
    const commentInputEl = document.querySelector('.comment-input input')
    if (commentInputEl) {
      commentInputEl.focus()
    }
  })
}

// 回复评论
const replyComment = (comment, reply = null) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  replyTo.value = reply ? {
    id: reply.author.id,
    name: reply.author.name,
    commentId: comment.id
  } : {
    id: comment.author.id,
    name: comment.author.name,
    commentId: comment.id
  }
  
  showComment()
}

// 图片轮播相关功能
// 切换到上一张图片
const prevImage = () => {
  if (!item.value?.images || item.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + item.value.images.length) % item.value.images.length;
}

// 切换到下一张图片
const nextImage = () => {
  if (!item.value?.images || item.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % item.value.images.length;
}

// 自动轮播
const startAutoPlay = () => {
  if (item.value?.images && item.value.images.length > 1) {
    stopAutoPlay();
    autoPlayTimer.value = setInterval(() => {
      nextImage();
    }, 4000);
  }
}

const stopAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
}

// 图片预览
const previewImage = (index) => {
  currentImageIndex.value = index;
  previewSrc.value = item.value.images[index];
  showImagePreview.value = true;
  stopAutoPlay(); // 预览模式停止自动轮播
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false;
  previewSrc.value = '';
  startAutoPlay(); // 关闭预览后重新开始自动轮播
}

// 分享物品
const shareItem = () => {
  // 生成分享链接
  const shareUrl = window.location.href;
  
  // 复制到剪贴板
  navigator.clipboard.writeText(shareUrl)
    .then(() => {
      showToast('链接已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      showToast('复制失败，请手动复制链接');
    });
}

// 分享到指定平台
const shareVia = (platform) => {
  // 实际应用中这里应该调用相应的分享API
  console.log('分享到', platform)
  
  if (platform === 'link') {
    // 复制链接
    const url = window.location.href
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('链接已复制')
      },
      () => {
        showToast('复制失败，请手动复制')
      }
    )
  }
  
  showSharePopup.value = false
}

// 跳转到用户主页
const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 跳转到其他失物招领详情
const goToLostFoundDetail = (id) => {
  if (id === item.value.id) return
  router.push(`/lost-found/detail/${id}`)
}

// 显示提示消息
const showToast = (message) => {
  // 这里使用一个简单的alert来模拟toast提示
  // 实际生产环境中应该使用UI库的toast组件
  alert(message);
  
  // 模拟toast效果，可根据实际UI库替换
  toast.message = message;
  toast.show = true;
  
  setTimeout(() => {
    toast.show = false;
  }, 3000);
};

// 更新点赞功能
const likeItem = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const id = item.value.id
    let res
    
    if (item.value.isLiked) {
      res = await unlikeLostFound(id)
    } else {
      res = await likeLostFound(id)
    }
    
    if (res.code === 200) {
      item.value.isLiked = res.data.isLiked
      item.value.likes = res.data.likeCount
      showToast(item.value.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      showToast('操作失败')
    }
  } catch (error) {
    console.error('点赞操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 评论点赞功能
const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  console.log('点赞评论:', comment.id);
  // 在实际项目中，调用评论点赞API
  try {
    // 如果有API可以调用实际API：
    // const res = await api.lostFound.likeComment(comment.id);
    
    // 前端模拟点赞效果
    comment.isLiked = !comment.isLiked;
    comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : Math.max(0, (comment.likeCount || 1) - 1);
    showToast(comment.isLiked ? '点赞成功' : '已取消点赞');
  } catch (error) {
    console.error('点赞评论失败', error);
    showToast('操作失败，请稍后重试');
  }
}

// 查看更多相似物品
const viewMoreSimilar = () => {
  // 导航到包含类似物品的搜索页面
  if (item.value && item.value.category) {
    router.push({
      path: '/lost-found/list',
      query: { 
        category: item.value.category,
        type: item.value.type 
      }
    });
  }
}

// 查看更多相关物品
const viewMoreRelated = () => {
  // 导航到包含相关物品的搜索页面
  if (item.value) {
    router.push({
      path: '/lost-found/list',
      query: { 
        type: item.value.type === 'lost' ? 'found' : 'lost',  // 类型相反
        keyword: item.value.title?.split(/\s+/)[0] || ''  // 使用标题的第一个关键词
      }
    });
  }
}

// 格式化数字显示
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  
  const number = parseInt(num);
  if (number < 1000) {
    return number.toString();
  } else if (number < 10000) {
    return (number / 1000).toFixed(1) + 'K';
  } else {
    return (number / 10000).toFixed(1) + 'W';
  }
}

// 查看位置
const viewLocation = () => {
  if (item.value && item.value.location) {
    if (item.value.coordinates) {
      const { latitude, longitude } = item.value.coordinates
      window.open(`https://maps.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(item.value.location)}`, '_blank')
    }
  } else {
    showToast('暂无地理位置信息')
  }
}

// 解析图片数据
const parsedImages = computed(() => {
  if (!item.value || !item.value.images) return [];
  
  try {
    // 如果已经是数组，直接使用
    if (Array.isArray(item.value.images)) {
      return item.value.images.map(img => {
        // 处理数组中的字符串JSON
        if (typeof img === 'string') {
          if (img.startsWith('[') && img.includes('"')) {
            try {
              const parsed = JSON.parse(img);
              return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : img;
            } catch (e) {
              console.error('解析图片JSON字符串失败:', e);
              return img;
            }
          }
          return img;
        }
        return img;
      });
    }
    
    // 如果是字符串形式，尝试解析JSON
    if (typeof item.value.images === 'string') {
      try {
        if (item.value.images.startsWith('[')) {
          const parsed = JSON.parse(item.value.images);
          return Array.isArray(parsed) ? parsed : [item.value.images];
        }
        return [item.value.images];
      } catch (e) {
        console.error('解析图片字符串失败:', e);
        return [item.value.images];
      }
    }
    
    // 默认返回空数组
    return [];
  } catch (error) {
    console.error('处理图片数据时出错:', error);
    return [];
  }
});

// 处理图片加载错误
const handleImageError = (event) => {
  // 替换为默认图片
  event.target.src = getDefaultImage(item.value.type || 'found');
};

// 获取默认图片
const getDefaultImage = (type) => {
  if (type === 'lost') {
    return '/images/default-lost.jpg';
  }
  return '/images/default-found.jpg';
};

// 获取默认头像
const getDefaultAvatar = () => {
  return '/images/default-avatar.jpg';
};

// 处理头像加载错误
const handleAvatarError = (event) => {
  event.target.src = getDefaultAvatar();
};

// 获取状态颜色
const getStatusColor = (status) => {
  if (!status || status === 'pending') return 'info';
  if (status === 'found' || status === 'claimed') return 'success';
  if (status === 'closed') return 'grey';
  return 'info';
};

// 确保数据完整性
onMounted(() => {
  // 设置默认值，确保数据展示正常
  if (!item.value.type) {
    item.value.type = 'found'; // 默认为招领启事
  }
  
  if (!item.value.category) {
    item.value.category = '数码产品'; // 基于物品描述推断类别
  }
  
  if (!item.value.status) {
    item.value.status = 'pending'; // 默认为待认领状态
  }

  if (!item.value.lostFoundTime) {
    // 使用创建时间或当前时间作为默认
    item.value.lostFoundTime = item.value.createdAt || new Date().toISOString();
  }
  
  if (!item.value.createdAt) {
    item.value.createdAt = new Date().toISOString();
  }
  
  if (!item.value.images) {
    // 设置默认图片
    item.value.images = ['https://img01.yzcdn.cn/vant/apple-1.jpg'];
  }
  
  if (!comments.value) {
    comments.value = [];
  }
  
  // 加载详情数据
  fetchItemDetail();
  
  // 加载评论
  refreshComments();
});

// 提交举报函数
const submitReport = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  try {
    // 构建举报数据
    const reportData = {
      targetId: route.params.id,
      targetType: 'lostfound',
      reason: reportReason.value,
      detail: reportReason.value === 'other' ? reportDetail.value : '',
    };
    
    console.log('提交举报:', reportData);
    
    // 这里添加实际API调用，暂时用setTimeout模拟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 关闭举报对话框并重置表单
    showReportDialog.value = false;
    reportReason.value = 'fake';
    reportDetail.value = '';
    
    // 显示成功提示
    showToast('举报已提交，我们会尽快处理');
  } catch (error) {
    console.error('举报提交失败:', error);
    showToast('举报提交失败，请稍后重试');
  }
};

// 处理分享选择
const onShareSelect = (option) => {
  Toast(`已选择 ${option.name}`);
  
  if (option.name === '复制链接') {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        Toast('链接已复制到剪贴板');
      })
      .catch(() => {
        Toast('复制失败，请手动复制链接');
      });
  } else {
    // 这里可以接入实际的分享SDK
    Toast(`分享到${option.name}功能暂未接入，敬请期待`);
  }
  
  showSharePopup.value = false;
};
</script>

<style scoped>
.lost-found-detail-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 50px;
}

.detail-container {
  padding: 10px;
}

.card-style {
  margin: 12px 0;
  border-radius: 12px;
  overflow: hidden;
}

.mr-8 {
  margin-right: 8px;
}

.image-wrapper {
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  margin-bottom: 2px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.image-swiper {
  height: 230px;
}

.title-cell {
  border-bottom: 1px solid #f5f5f5;
}

.title-row {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.item-title {
  font-size: 18px;
  line-height: 1.3;
  font-weight: 500;
}

.description-text {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.5;
  color: #666;
}

.primary-action {
  margin: 15px 12px;
}

.publisher-info {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.publisher-cell {
  padding: 10px 16px;
}

.publisher-avatar {
  margin-right: 12px;
}

.publisher-details {
  flex: 1;
}

.publisher-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.publish-time {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.action-grid {
  margin: 0 12px;
  background-color: #fff;
  border-radius: 8px;
  padding: 5px 0;
}

.favorite-active {
  color: #ff9900;
}

.comments-section {
  margin-top: 16px;
}

.comment-item {
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.comment-last {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  flex: 1;
  margin-left: 12px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.comment-content {
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  margin-left: 48px; /* 与头像对齐 */
}

.comment-count {
  font-weight: normal;
  color: #999;
}

.comment-input {
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.empty-comment {
  padding: 30px 0;
}

.text-gray {
  color: #999;
}

.dialog-content {
  padding: 16px;
}

.dialog-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.report-detail {
  margin-top: 16px;
}

.loading {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>