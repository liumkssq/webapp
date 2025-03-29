<template>
  <div class="profile-page">
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
      <div class="nav-title">个人资料</div>
      <div class="nav-actions">
        <div class="settings-btn" @click="goToSettings">
          <i class="icon-settings"></i>
        </div>
        <div class="save-btn" @click="saveProfile" v-if="isEditing">
          保存
        </div>
      </div>
    </div>
    
    <!-- 个人资料卡片 -->
    <div class="profile-card">
      <!-- 头像 -->
      <div class="avatar-container">
        <div class="avatar-wrapper">
          <img :src="userInfo.avatar" alt="头像" class="user-avatar">
          <div class="edit-avatar" v-if="isEditing" @click="selectAvatar">
            <i class="icon-camera"></i>
          </div>
        </div>
      </div>
      
      <!-- 用户信息表单 -->
      <div class="user-info-form">
        <!-- 昵称 -->
        <div class="form-item">
          <div class="form-label">昵称</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.nickname }}</div>
          <input 
            v-else 
            type="text" 
            v-model="editForm.nickname" 
            class="form-input-field" 
            placeholder="请输入昵称"
          >
        </div>
        
        <!-- 性别 -->
        <div class="form-item">
          <div class="form-label">性别</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.gender }}</div>
          <select v-else v-model="editForm.gender" class="form-select">
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="保密">保密</option>
          </select>
        </div>
        
        <!-- 学校 -->
        <div class="form-item">
          <div class="form-label">学校</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.school }}</div>
          <input 
            v-else 
            type="text" 
            v-model="editForm.school" 
            class="form-input-field" 
            placeholder="请输入学校"
          >
        </div>
        
        <!-- 专业 -->
        <div class="form-item">
          <div class="form-label">专业</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.major }}</div>
          <input 
            v-else 
            type="text" 
            v-model="editForm.major" 
            class="form-input-field" 
            placeholder="请输入专业"
          >
        </div>
        
        <!-- 入学年份 -->
        <div class="form-item">
          <div class="form-label">入学年份</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.enrollmentYear }}</div>
          <select v-else v-model="editForm.enrollmentYear" class="form-select">
            <option v-for="year in enrollmentYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
        
        <!-- 手机号 -->
        <div class="form-item">
          <div class="form-label">手机号</div>
          <div class="form-input" v-if="!isEditing">{{ maskPhone(userInfo.phone) }}</div>
          <div class="form-action" v-if="!isEditing" @click="goToBindPhone">
            {{ userInfo.phone ? '更换' : '绑定' }}
          </div>
        </div>
        
        <!-- 邮箱 -->
        <div class="form-item">
          <div class="form-label">邮箱</div>
          <div class="form-input" v-if="!isEditing">{{ userInfo.email || '未绑定' }}</div>
          <input 
            v-else 
            type="email" 
            v-model="editForm.email" 
            class="form-input-field" 
            placeholder="请输入邮箱"
          >
        </div>
        
        <!-- 个人简介 -->
        <div class="form-item bio-item">
          <div class="form-label">个人简介</div>
          <div class="form-input bio-text" v-if="!isEditing">{{ userInfo.bio || '这个人很懒，什么都没留下' }}</div>
          <textarea 
            v-else 
            v-model="editForm.bio" 
            class="form-textarea" 
            placeholder="请输入个人简介"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <!-- 编辑按钮 -->
      <div class="edit-profile-btn" v-if="!isEditing" @click="startEditing">
        编辑资料
      </div>
    </div>
    
    <!-- 安全设置 -->
    <div class="security-section">
      <div class="section-title">账号安全</div>
      
      <div class="setting-item" @click="goToChangePwd">
        <div class="setting-label">修改密码</div>
        <div class="setting-action">
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <div class="setting-item" @click="goToSettings">
        <div class="setting-label">更多设置</div>
        <div class="setting-action">
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <div class="setting-item" @click="logout">
        <div class="setting-label logout-label">退出登录</div>
      </div>
    </div>
    
    <!-- 操作提示 -->
    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// 是否处于编辑状态
const isEditing = ref(false)

// 用户信息
const userInfo = ref({
  nickname: '',
  avatar: 'https://via.placeholder.com/200',
  gender: '保密',
  school: '',
  major: '',
  enrollmentYear: '',
  phone: '',
  email: '',
  bio: ''
})

// 编辑表单
const editForm = reactive({
  nickname: '',
  gender: '保密',
  school: '',
  major: '',
  enrollmentYear: '',
  email: '',
  bio: ''
})

// 提示信息
const toast = reactive({
  show: false,
  message: ''
})

// 入学年份选项
const currentYear = new Date().getFullYear()
const enrollmentYears = computed(() => {
  const years = []
  for (let i = 0; i < 10; i++) {
    years.push(currentYear - i)
  }
  return years
})

// 加载用户信息
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    // 未登录则跳转至登录页
    router.replace('/login')
    return
  }
  
  try {
    // 在实际应用中，这里应该从userStore获取用户信息
    // 这里使用模拟数据
    setTimeout(() => {
      userInfo.value = {
        nickname: userStore.nickname || '用户昵称',
        avatar: userStore.avatar || 'https://via.placeholder.com/200',
        gender: '男',
        school: '示例大学',
        major: '计算机科学',
        enrollmentYear: '2022',
        phone: userStore.phone || '13800138000',
        email: userStore.email || 'example@mail.com',
        bio: '这是个人简介，介绍一下自己吧'
      }
    }, 300)
  } catch (error) {
    console.error('获取用户信息失败', error)
    showToast('获取用户信息失败')
  }
})

// 开始编辑
const startEditing = () => {
  // 初始化表单数据
  Object.keys(editForm).forEach(key => {
    editForm[key] = userInfo.value[key] || ''
  })
  
  isEditing.value = true
}

// 保存资料
const saveProfile = async () => {
  // 表单验证
  if (!editForm.nickname) {
    showToast('昵称不能为空')
    return
  }
  
  try {
    // 模拟API调用
    showToast('保存中...')
    
    setTimeout(() => {
      // 更新本地用户信息
      Object.keys(editForm).forEach(key => {
        userInfo.value[key] = editForm[key]
      })
      
      // 更新用户存储
      userStore.updateUserInfo({
        nickname: editForm.nickname,
        email: editForm.email
      })
      
      isEditing.value = false
      showToast('保存成功')
    }, 1000)
  } catch (error) {
    console.error('保存用户信息失败', error)
    showToast('保存失败，请重试')
  }
}

// 选择头像
const selectAvatar = () => {
  // 在实际应用中，这里应该调用文件选择器
  showToast('头像上传功能开发中...')
}

// 处理手机号码遮挡显示
const maskPhone = (phone) => {
  if (!phone) return '未绑定'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 前往绑定手机号
const goToBindPhone = () => {
  showToast('手机号绑定功能开发中...')
}

// 导航到修改密码页面
const goToChangePwd = () => {
  router.push('/password/change')
}

// 导航到设置页面
const goToSettings = () => {
  router.push('/settings')
}

// 退出登录
const logout = async () => {
  try {
    await userStore.userLogout()
    showToast('退出登录成功')
    
    // 跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    console.error('退出登录失败', error)
    showToast('退出登录失败，请重试')
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
  if (isEditing.value) {
    // 如果正在编辑，则退出编辑模式
    isEditing.value = false
  } else {
    router.back()
  }
}
</script>