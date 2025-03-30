<template>
  <div class="login-page">
    <div class="login-header">
      <h1>登录</h1>
      <p>欢迎回到校园信息平台</p>
    </div>
    
    <div class="login-form">
      <div class="login-tabs">
        <div 
          :class="['tab-item', { active: loginType === 'account' }]" 
          @click="loginType = 'account'"
        >
          账号密码登录
        </div>
        <div 
          :class="['tab-item', { active: loginType === 'sms' }]" 
          @click="loginType = 'sms'"
        >
          短信验证码登录
        </div>
      </div>
      
      <!-- 账号密码登录 -->
      <form v-if="loginType === 'account'" @submit.prevent="handleAccountLogin">
        <div class="form-item">
          <label>账号</label>
          <input 
            type="text" 
            v-model="accountForm.username" 
            placeholder="用户名/手机号/邮箱" 
            required 
          />
        </div>
        
        <div class="form-item">
          <label>密码</label>
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="accountForm.password" 
            placeholder="请输入密码" 
            required 
          />
          <div class="password-toggle" @click="showPassword = !showPassword">
            <svg-icon :name="showPassword ? 'eye' : 'eye-off'" />
          </div>
        </div>
        
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="accountForm.remember" />
            <label for="remember" @click.stop>记住我</label>
          </div>
          <router-link to="/forgot-password">忘记密码?</router-link>
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="accountLoading"
        >
          {{ accountLoading ? '登录中...' : '登录' }}
        </button>
        
        <!-- 快速登录 -->
        <div class="quick-login">
          <button 
            type="button" 
            class="quick-login-button" 
            @click="handleAdminLogin" 
            :disabled="accountLoading"
          >
            {{ accountLoading ? '登录中...' : '一键登录(管理员)' }}
          </button>
          <p class="quick-login-tip">开发环境专用，无需账号密码</p>
        </div>
      </form>
      
      <!-- 短信验证码登录 -->
      <form v-else @submit.prevent="handleSmsLogin">
        <div class="form-item">
          <label>手机号</label>
          <input 
            type="tel" 
            v-model="smsForm.phone" 
            placeholder="请输入手机号" 
            required 
            pattern="^1[3-9]\d{9}$"
          />
        </div>
        
        <div class="form-item verification-code">
          <label>验证码</label>
          <input 
            type="text" 
            v-model="smsForm.verificationCode" 
            placeholder="请输入验证码" 
            required 
          />
          <button 
            type="button" 
            class="send-code-button" 
            @click="sendVerificationCode" 
            :disabled="codeSending || countdown > 0"
          >
            {{ countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码' }}
          </button>
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="smsLoading"
        >
          {{ smsLoading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="register-link">
        还没有账号? <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, loginByVerificationCode, apiSendVerificationCode, autoLogin, adminLogin } from '@/api/user'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 登录类型切换
const loginType = ref('account')
const showPassword = ref(false)

// 账号密码登录表单
const accountForm = reactive({
  username: 'admin',  // 预设为admin账号
  password: '123456', // 预设为123456密码
  remember: false
})

// 短信验证码登录表单
const smsForm = reactive({
  phone: '',
  verificationCode: ''
})

// 加载状态
const accountLoading = ref(false)
const smsLoading = ref(false)
const codeSending = ref(false)

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

// 账号密码登录
const handleAccountLogin = async () => {
  try {
    accountLoading.value = true
    const response = await login({
      username: accountForm.username,
      password: accountForm.password
    })
    
    if (response.code === 200) {
      // 保存用户信息和token
      userStore.login(response.data.token, response.data.userInfo)
      
      // 显示登录成功消息
      messageStore.showSuccess('登录成功')
      
      // 重定向到之前的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      messageStore.showError(response.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    messageStore.showError('登录失败，请稍后重试')
  } finally {
    accountLoading.value = false
  }
}

// 短信验证码登录
const handleSmsLogin = async () => {
  try {
    smsLoading.value = true
    
    const response = await loginByVerificationCode({
      phone: smsForm.phone,
      verificationCode: smsForm.verificationCode
    })
    
    if (response.code === 200) {
      // 保存用户信息和token
      userStore.login(response.data.token, response.data.userInfo)
      
      // 显示登录成功消息
      messageStore.showSuccess('登录成功')
      
      // 重定向到之前的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      messageStore.showError(response.message || '登录失败，请检查手机号和验证码')
    }
  } catch (error) {
    console.error('登录失败:', error)
    messageStore.showError('登录失败，请稍后重试')
  } finally {
    smsLoading.value = false
  }
}

// 发送验证码
const sendVerificationCode = async () => {
  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(smsForm.phone)) {
    messageStore.showError('请输入正确的手机号')
    return
  }
  
  try {
    codeSending.value = true
    
    const response = await apiSendVerificationCode({
      phone: smsForm.phone
    })
    
    if (response.code === 200) {
      messageStore.showSuccess('验证码已发送')
      
      // 开始倒计时
      countdown.value = 60
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1
        } else {
          clearInterval(countdownTimer)
        }
      }, 1000)
    } else {
      messageStore.showError(response.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('验证码发送失败:', error)
    messageStore.showError('验证码发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

// 一键登录（管理员账号）
const handleAdminLogin = async () => {
  try {
    accountLoading.value = true
    
    // 使用专门的admin登录方法
    const response = await adminLogin()
    
    if (response.code === 200) {
      // 保存用户信息和token
      userStore.login(response.data.token, response.data.userInfo)
      
      // 显示登录成功消息
      messageStore.showSuccess('管理员一键登录成功')
      
      // 重定向到之前的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      messageStore.showError(response.message || '一键登录失败')
    }
  } catch (error) {
    console.error('一键登录失败:', error)
    messageStore.showError('一键登录失败，请稍后重试')
  } finally {
    accountLoading.value = false
  }
}

// 自动填充表单并登录（开发模式专用）
onMounted(() => {
  // 开发环境下自动填充登录表单
  if (import.meta.env.DEV) {
    accountForm.username = 'admin'
    accountForm.password = '123456'
    
    // 如果URL带有auto=true参数，则自动登录
    if (route.query.auto === 'true') {
      handleAccountLogin()
    }
  }
})

// 组件销毁前清除定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
/* 快速登录样式 */
.quick-login {
  margin-top: 20px;
  text-align: center;
}

.quick-login-button {
  width: 100%;
  padding: 12px;
  background-color: #ffc107;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-login-button:hover {
  background-color: #ffb300;
}

.quick-login-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

.quick-login-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>