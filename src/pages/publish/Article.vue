<template>
  <div class="publish-article-page">
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
      <div class="nav-title">发布文章</div>
      <div class="publish-btn" @click="publishArticle" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>
    
    <!-- 文章编辑区域 -->
    <div class="article-editor">
      <!-- 标题输入 -->
      <div class="title-input-container">
        <input 
          type="text" 
          v-model="articleForm.title" 
          placeholder="请输入文章标题" 
          class="title-input"
          maxlength="50"
        >
        <div class="title-length">{{ articleForm.title.length }}/50</div>
      </div>
      
      <!-- 内容输入 -->
      <div class="content-input-container">
        <textarea 
          v-model="articleForm.content" 
          placeholder="分享你的想法、知识和经验..." 
          class="content-input"
          rows="8"
        ></textarea>
      </div>
      
      <!-- 图片上传 -->
      <div class="images-container">
        <div class="images-list">
          <div 
            v-for="(image, index) in articleForm.images" 
            :key="index" 
            class="image-item"
          >
            <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
            <div class="delete-image" @click="removeImage(index)">
              <i class="icon-close"></i>
            </div>
          </div>
          
          <div class="add-image-btn" v-if="articleForm.images.length < 9" @click="addImage">
            <i class="icon-add-image"></i>
            <span>{{ articleForm.images.length }}/9</span>
          </div>
        </div>
      </div>
      
      <!-- 标签选择 -->
      <div class="tags-container">
        <div class="section-title">添加标签 <span class="optional">(选填)</span></div>
        <div class="tags-list">
          <div 
            v-for="tag in recommendedTags" 
            :key="tag" 
            class="tag-item"
            :class="{ active: articleForm.tags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
          
          <div class="add-custom-tag" @click="showCustomTagInput = true" v-if="!showCustomTagInput">
            <i class="icon-add"></i> 自定义
          </div>
          
          <div class="custom-tag-input" v-if="showCustomTagInput">
            <input 
              type="text" 
              v-model="customTag" 
              placeholder="自定义标签" 
              class="tag-input"
              maxlength="10"
              @keyup.enter="addCustomTag"
            >
            <div class="add-tag-btn" @click="addCustomTag">
              添加
            </div>
          </div>
        </div>
        
        <div class="selected-tags" v-if="articleForm.tags.length > 0">
          <div class="section-title">已选标签:</div>
          <div class="tags-chips">
            <div 
              v-for="tag in articleForm.tags" 
              :key="tag" 
              class="tag-chip"
            >
              {{ tag }}
              <i class="icon-close" @click="removeTag(tag)"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 隐私设置 -->
      <div class="privacy-container">
        <div class="section-title">谁可以看到这篇文章？</div>
        <div class="privacy-options">
          <div 
            class="privacy-option"
            :class="{ active: articleForm.visibility === 'public' }"
            @click="articleForm.visibility = 'public'"
          >
            <div class="option-icon">
              <i class="icon-public"></i>
            </div>
            <div class="option-info">
              <div class="option-title">公开</div>
              <div class="option-desc">所有人可见</div>
            </div>
            <div class="option-check">
              <div class="check-circle" v-if="articleForm.visibility === 'public'"></div>
            </div>
          </div>
          
          <div 
            class="privacy-option"
            :class="{ active: articleForm.visibility === 'friends' }"
            @click="articleForm.visibility = 'friends'"
          >
            <div class="option-icon">
              <i class="icon-friends"></i>
            </div>
            <div class="option-info">
              <div class="option-title">好友可见</div>
              <div class="option-desc">仅你的好友可见</div>
            </div>
            <div class="option-check">
              <div class="check-circle" v-if="articleForm.visibility === 'friends'"></div>
            </div>
          </div>
          
          <div 
            class="privacy-option"
            :class="{ active: articleForm.visibility === 'private' }"
            @click="articleForm.visibility = 'private'"
          >
            <div class="option-icon">
              <i class="icon-private"></i>
            </div>
            <div class="option-info">
              <div class="option-title">仅自己可见</div>
              <div class="option-desc">仅你自己可见</div>
            </div>
            <div class="option-check">
              <div class="check-circle" v-if="articleForm.visibility === 'private'"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 文章表单
const articleForm = reactive({
  title: '',
  content: '',
  images: [],
  tags: [],
  visibility: 'public'
})

// 推荐标签
const recommendedTags = [
  '校园生活', '学习经验', '考试资料', '社团活动', 
  '校园美食', '旅行记录', '读书笔记', '技术分享',
  '情感生活', '兼职实习', '二手交易', '活动通知'
]

// 自定义标签相关
const showCustomTagInput = ref(false)
const customTag = ref('')

// 提示信息
const toast = reactive({
  show: false,
  message: ''
})

// 表单是否有效
const isFormValid = computed(() => {
  return articleForm.title.trim() !== '' && articleForm.content.trim() !== ''
})

// 添加图片
const addImage = () => {
  // 在实际应用中，这里应该调用文件选择器
  if (articleForm.images.length >= 9) {
    showToast('最多上传9张图片')
    return
  }
  
  // 模拟上传图片
  const mockImage = {
    id: Date.now(),
    url: `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`
  }
  
  articleForm.images.push(mockImage)
}

// 移除图片
const removeImage = (index) => {
  articleForm.images.splice(index, 1)
}

// 切换标签
const toggleTag = (tag) => {
  const index = articleForm.tags.indexOf(tag)
  if (index === -1) {
    if (articleForm.tags.length >= 5) {
      showToast('最多选择5个标签')
      return
    }
    articleForm.tags.push(tag)
  } else {
    articleForm.tags.splice(index, 1)
  }
}

// 添加自定义标签
const addCustomTag = () => {
  if (!customTag.value.trim()) {
    showToast('标签不能为空')
    return
  }
  
  if (articleForm.tags.length >= 5) {
    showToast('最多选择5个标签')
    return
  }
  
  if (articleForm.tags.includes(customTag.value)) {
    showToast('该标签已存在')
    return
  }
  
  articleForm.tags.push(customTag.value)
  customTag.value = ''
  showCustomTagInput.value = false
}

// 移除标签
const removeTag = (tag) => {
  const index = articleForm.tags.indexOf(tag)
  if (index !== -1) {
    articleForm.tags.splice(index, 1)
  }
}

// 发布文章
const publishArticle = async () => {
  if (!isFormValid.value) {
    showToast('请填写标题和内容')
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
      
      // 跳转到文章列表页
      setTimeout(() => {
        router.push('/article-list')
      }, 1000)
    }, 1500)
  } catch (error) {
    console.error('发布文章失败', error)
    showToast('发布失败，请重试')
  }
}

// 显示提示信息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>