<template>
  <div class="register-container">
    <div class="register-header">
      <h2>注册</h2>
    </div>
    
    <div class="register-form">
      <div class="form-item">
        <input
          v-model="registerForm.username"
          type="text"
          placeholder="用户名"
        />
      </div>
      
      <div class="form-item">
        <input
          v-model="registerForm.phone"
          type="tel"
          placeholder="手机号"
        />
      </div>
      
      <div class="form-item verify-code">
        <input
          v-model="registerForm.code"
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
          v-model="registerForm.password"
          type="password"
          placeholder="密码"
        />
      </div>
      
      <div class="form-item">
        <input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="确认密码"
        />
      </div>
      
      <div class="form-agreement">
        <input
          v-model="agreement"
          type="checkbox"
          id="agreement"
        />
        <label for="agreement">
          我已阅读并同意
          <a href="javascript:void(0)">用户协议</a>
          和
          <a href="javascript:void(0)">隐私政策</a>
        </label>
      </div>
      
      <div class="form-btn">
        <button @click="handleRegister">注册</button>
      </div>
      
      <div class="login-link">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { register, sendVerifyCode as apiSendVerifyCode } from '@/api/user'

const router = useRouter()

// 注册表单数据
const registerForm = reactive({
  username: '',
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 是否同意协议
const agreement = ref(false)

// 验证码倒计时
const countdown = ref(0)

// 发送验证码
const handleSendVerifyCode = async () => {
  if (!registerForm.phone) {
    alert('请输入手机号')
    return
  }
  
  try {
    await apiSendVerifyCode({ phone: registerForm.phone })
    
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

// 处理注册
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.username) {
    alert('请输入用户名')
    return
  }
  
  if (!registerForm.phone) {
    alert('请输入手机号')
    return
  }
  
  if (!registerForm.code) {
    alert('请输入验证码')
    return
  }
  
  if (!registerForm.password) {
    alert('请输入密码')
    return
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  if (!agreement.value) {
    alert('请阅读并同意用户协议和隐私政策')
    return
  }
  
  try {
    await register(registerForm)
    alert('注册成功')
    router.push('/login')
  } catch (error) {
    console.error('注册失败', error)
  }
}
</script>