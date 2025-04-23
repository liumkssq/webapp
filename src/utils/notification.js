/**
 * 消息通知工具
 * 提供系统通知、声音提示等功能
 */

// 检查浏览器是否支持通知
const isNotificationSupported = 'Notification' in window;

// 检查通知权限状态
const checkNotificationPermission = () => {
  if (!isNotificationSupported) {
    return 'unsupported';
  }
  return Notification.permission;
};

// 请求通知权限
const requestNotificationPermission = async () => {
  if (!isNotificationSupported) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('请求通知权限出错:', error);
    return false;
  }
};

// 显示通知
export const showNotification = (title, body, options = {}) => {
  // 检查是否在活跃标签页
  if (document.visibilityState === 'visible' && !options.forceShow) {
    return null;
  }

  // 检查是否支持通知及是否有权限
  if (!isNotificationSupported || Notification.permission !== 'granted') {
    console.log('通知不支持或未授权:', title, body);
    return null;
  }

  try {
    // 创建通知
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || 'im-notification',
      ...options
    });

    // 点击通知时的行为
    notification.onclick = () => {
      // 如果提供了点击回调，执行它
      if (options.onClick && typeof options.onClick === 'function') {
        options.onClick();
      }

      // 默认行为：聚焦窗口并关闭通知
      window.focus();
      notification.close();
    };

    // 自动关闭
    if (options.autoClose !== false) {
      setTimeout(() => {
        notification.close();
      }, options.duration || 5000);
    }

    // 播放通知声音
    if (options.sound !== false) {
      playNotificationSound(options.soundType);
    }

    return notification;
  } catch (error) {
    console.error('显示通知时出错:', error);
    return null;
  }
};

// 播放通知声音
let audioCache = {};
export const playNotificationSound = (type = 'message') => {
  // 检查是否静音
  const isMuted = localStorage.getItem('notification_muted') === 'true';
  if (isMuted) {
    return;
  }

  // 声音映射
  const soundMap = {
    message: '/sounds/message.mp3',
    call: '/sounds/call.mp3',
    notification: '/sounds/notification.mp3'
  };

  const soundPath = soundMap[type] || soundMap.message;

  // 使用缓存的音频对象或创建新的
  if (!audioCache[type]) {
    audioCache[type] = new Audio(soundPath);
  }

  const audio = audioCache[type];
  
  // 播放声音
  audio.currentTime = 0;
  audio.play().catch(error => {
    console.error('播放通知声音失败:', error);
  });
};

// 初始化通知系统
export const initNotifications = async () => {
  // 如果已经获得了权限，直接返回
  if (checkNotificationPermission() === 'granted') {
    return true;
  }

  // 如果之前被拒绝，不再请求
  if (checkNotificationPermission() === 'denied') {
    return false;
  }

  // 请求权限
  return await requestNotificationPermission();
};

export default {
  isNotificationSupported,
  checkNotificationPermission,
  requestNotificationPermission,
  showNotification,
  playNotificationSound,
  initNotifications
};