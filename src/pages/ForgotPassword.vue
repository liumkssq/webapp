<template>
  <div class="forgot-password-container">
    <div class="forgot-password-header">
      <h2>找回密码</h2>
    </div>
    
    <div class="forgot-password-form">
      <div class="form-item">
        <input
          v-model="resetForm.phone"
          type="tel"
          placeholder="手机号"
        />
      </div>
      
      <div class="form-item verify-code">
        <input
          v-model="resetForm.code"
          type="text"
          placeholder="验证码"
        />
        <button 
          @click="handleSendVerifyCode" 
          :disabled="countdown > 0"
        >
          {{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
        </button>
      </div>
      
      <div class="form-item">
        <input
          v-model="resetForm.newPassword"
          type="password"
          placeholder="新密码"
        />
      </div>
      
      <div class="form-item">
        <input
          v-model="resetForm.confirmPassword"
          type="password"
          placeholder="确认密码"
        />
      </div>
      
      <div class="form-btn">
        <button @click="handleResetPassword">重置密码</button>
      </div>
      
      <div class="back-to-login">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { sendVerifyCode as apiSendVerifyCode, resetPassword } from '@/api/user'

const router = useRouter()

// 重置密码表单数据
const resetForm = reactive({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证码倒计时
const countdown = ref(0)

// 发送验证码
const handleSendVerifyCode = async () => {
  if (!resetForm.phone) {
    alert('请输入手机号')
    return
  }
  
  try {
    await apiSendVerifyCode({ phone: resetForm.phone })
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败', error)
  }
}

// 处理重置密码
const handleResetPassword = async () => {
  // 表单验证
  if (!resetForm.phone) {
    alert('请输入手机号')
    return
  }
  
  if (!resetForm.code) {
    alert('请输入验证码')
    return
  }
  
  if (!resetForm.newPassword) {
    alert('请输入新密码')
    return
  }
  
  if (resetForm.newPassword !== resetForm.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  try {
    await resetPassword(resetForm)
    alert('密码重置成功')
    router.push('/login')
  } catch (error) {
    console.error('重置密码失败', error)
  }
}
</script>