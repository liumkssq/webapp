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
    
    <!-- 顶部导航栏 -->
    <div class="navigation-bar">
      <div class="back-button" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="page-title">发布文章</div>
      <div class="publish-button" @click="publishArticle" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>
    
    <!-- AI助手按钮 -->
    <div class="ai-assistant-btn" @click="showAIAssistant = true">
      <i class="icon-ai"></i>
      <span>AI写作助手</span>
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
    
    <!-- AI写作助手弹出层 -->
    <van-popup
      v-model:show="showAIAssistant"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <div class="ai-assistant">
        <div class="assistant-header">
          <div class="assistant-title">AI写作助手</div>
          <van-icon name="cross" @click="showAIAssistant = false" />
        </div>
        
        <div class="assistant-content">
          <div class="assistant-options">
            <div class="option-section">
              <div class="section-title">选择功能</div>
              <div class="options-grid">
                <div 
                  v-for="option in aiOptions" 
                  :key="option.id"
                  class="option-item"
                  :class="{ active: currentAIOption === option.id }"
                  @click="currentAIOption = option.id"
                >
                  <van-icon :name="option.icon" :color="currentAIOption === option.id ? '#1989fa' : '#969799'" />
                  <span>{{ option.name }}</span>
                </div>
              </div>
            </div>
            
            <div class="option-section">
              <div class="section-title">提示词</div>
              <textarea 
                v-model="aiPrompt" 
                placeholder="输入指令，如：'生成一篇关于校园二手交易的文章大纲'"
                rows="3"
              ></textarea>
            </div>
            
            <van-button 
              type="primary" 
              block 
              @click="generateContent" 
              :loading="isGenerating"
              :disabled="!aiPrompt.trim()"
            >
              {{ isGenerating ? '生成中...' : '生成内容' }}
            </van-button>
          </div>
          
          <div v-if="generatedContent" class="generated-content">
            <div class="content-header">
              <div class="content-title">生成结果</div>
              <div class="content-actions">
                <van-button size="mini" plain type="primary" @click="regenerateContent">
                  <van-icon name="replay" /> 重新生成
                </van-button>
                <van-button size="mini" type="primary" @click="useGeneratedContent">
                  <van-icon name="success" /> 使用
                </van-button>
              </div>
            </div>
            
            <div class="content-body">
              <div v-if="currentAIOption === 'title'" class="title-result">
                {{ generatedContent }}
              </div>
              <div v-else-if="currentAIOption === 'outline'" class="outline-result">
                <div v-for="(item, index) in generatedContent.split('\n')" :key="index" class="outline-item">
                  {{ item }}
                </div>
              </div>
              <div v-else class="text-result">
                <p v-for="(paragraph, index) in generatedContent.split('\n\n')" :key="index">
                  {{ paragraph }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

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

// AI助手相关状态
const showAIAssistant = ref(false)
const aiPrompt = ref('')
const currentAIOption = ref('content')
const isGenerating = ref(false)
const generatedContent = ref('')

// AI助手选项
const aiOptions = [
  { id: 'title', name: '标题生成', icon: 'label-o' },
  { id: 'outline', name: '内容大纲', icon: 'bars' },
  { id: 'content', name: '正文生成', icon: 'description' },
  { id: 'polish', name: '内容润色', icon: 'brush-o' }
]

// 生成内容
const generateContent = async () => {
  if (!aiPrompt.value.trim()) return
  
  try {
    isGenerating.value = true
    
    // 模拟AI生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 根据不同选项生成不同内容
    switch (currentAIOption.value) {
      case 'title':
        generatedContent.value = generateMockTitle()
        break
      case 'outline':
        generatedContent.value = generateMockOutline()
        break
      case 'content':
        generatedContent.value = generateMockContent()
        break
      case 'polish':
        generatedContent.value = generatePolishedContent()
        break
    }
    
    isGenerating.value = false
  } catch (error) {
    console.error('内容生成失败:', error)
    showToast('内容生成失败，请重试')
    isGenerating.value = false
  }
}

// 重新生成内容
const regenerateContent = () => {
  generateContent()
}

// 使用生成的内容
const useGeneratedContent = () => {
  switch (currentAIOption.value) {
    case 'title':
      articleForm.title = generatedContent.value
      break
    case 'outline':
      // 将大纲添加到内容前面
      articleForm.content = generatedContent.value + '\n\n' + (articleForm.content || '')
      break
    case 'content':
      articleForm.content = generatedContent.value
      break
    case 'polish':
      articleForm.content = generatedContent.value
      break
  }
  
  showAIAssistant.value = false
  showToast('内容已应用')
}

// 模拟标题生成
const generateMockTitle = () => {
  const titles = [
    '大学生二手交易平台：让闲置物品焕发新生',
    '校园二手市场的机遇与挑战：一个学生的视角',
    '从废旧到珍贵：校园二手交易的可持续发展之路',
    '数字化时代的校园二手经济：趋势与前景分析'
  ]
  
  return titles[Math.floor(Math.random() * titles.length)]
}

// 模拟大纲生成
const generateMockOutline = () => {
  return `1. 引言：校园二手交易的背景与意义
2. 校园二手交易现状分析
   2.1 传统二手交易方式
   2.2 线上二手交易平台的兴起
   2.3 校园二手交易的特点
3. 校园二手交易面临的问题
   3.1 信任与安全问题
   3.2 商品质量参差不齐
   3.3 交易流程不规范
4. 校园二手交易的优化策略
   4.1 建立信用评价体系
   4.2 完善商品描述标准
   4.3 引入第三方担保机制
5. 校园二手交易的未来发展
   5.1 与共享经济的结合
   5.2 专业化、垂直化发展
   5.3 社交化趋势
6. 结论：促进校园二手交易健康发展的建议`
}

// 模拟内容生成
const generateMockContent = () => {
  return `校园二手交易平台作为连接学生群体闲置物品供需的桥梁，近年来在各大高校迅速兴起。本文将探讨校园二手交易的现状、价值以及未来发展方向。

随着消费观念的转变和环保意识的增强，越来越多的大学生开始关注二手商品交易。校园内的二手交易主要涉及教材、电子产品、生活用品和服装等物品，这些物品往往使用时间短、保存完好，却因毕业、升级或个人喜好变化等原因被闲置。

校园二手交易的价值主要体现在三个方面：首先，它为学生提供了经济实惠的消费选择，缓解了学生群体的经济压力；其次，它延长了物品的使用周期，减少了资源浪费，符合可持续发展理念；最后，它培养了学生的经济意识和社交能力，为学生提供了实践机会。

然而，校园二手交易也面临诸多挑战。信任问题是最主要的障碍之一，买卖双方往往难以建立有效的信任机制，导致交易风险增加。此外，交易流程不规范、物品定价混乱、售后服务缺失等问题也制约着校园二手市场的健康发展。

为应对这些挑战，校园二手交易平台需要不断创新。建立健全的信用评价体系，引入第三方担保机制，规范交易流程，完善售后服务，这些措施都能有效提升用户体验和平台价值。同时，平台还可以探索与校园文化结合的特色服务，如二手教材共享、学长学姐经验传授等。

展望未来，校园二手交易平台将逐渐向专业化、社交化和生态化方向发展。通过与区块链等新技术的结合，平台可以构建更加透明、安全的交易环境；通过大数据分析，平台可以提供更加精准的商品推荐和价格指导；通过社交功能的强化，平台可以满足学生群体的社交需求，形成独特的校园二手文化。

总之，校园二手交易平台不仅是一种经济活动，更是一种文化现象和生活方式。它反映了当代大学生的消费观念和价值取向，代表了共享经济在校园的具体实践。随着技术的进步和理念的更新，校园二手交易必将迎来更加广阔的发展空间。`
}

// 模拟内容润色
const generatePolishedContent = () => {
  // 获取当前文章内容作为基础
  const baseContent = articleForm.content || '校园二手交易是一种重要的经济活动，能够帮助学生节省开支并减少浪费。'
  
  // 模拟润色后的内容
  return `${baseContent.trim()}

[润色后的内容]

校园二手交易不仅仅是一种普通的经济活动，它是连接学生需求与资源的重要纽带，是培养可持续消费理念的有效途径。通过精心设计的二手交易平台，学生们能够以极具吸引力的价格获取所需物品，大幅降低生活学习成本，同时让闲置物品焕发新的生命力，显著减少资源浪费和环境负担。

更重要的是，校园二手交易构建了一个独特的学生社交网络，促进了不同年级、不同专业学生之间的交流与互动。每一次交易背后，都有一个关于物品来源、使用体验和实用建议的故事，这些故事构成了丰富多彩的校园生活记忆。

在数字化时代，校园二手交易平台通过结合先进技术与贴心服务，正在创造更加安全、便捷、愉悦的用户体验。它不仅满足了当下需求，更代表了共享经济在校园场景的创新实践与美好未来。`
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>