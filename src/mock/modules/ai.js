import Mock from 'mockjs'
import { mockDelayResponse } from '../utils'

// 模拟图片分析
Mock.mock(/\/api\/ai\/analyze-image/, 'post', (options) => {
  const { body } = options
  const params = JSON.parse(body)
  const { category } = params

  let result = {
    description: '这是一款状态良好的二手iPhone手机，机身无明显划痕，边框轻微磨损，显示屏完好。配有原装充电器和耳机，适合追求性价比的用户。',
    titleSuggestions: [
      '95新 Apple iPhone 二手手机 外观完好 功能正常',
      '二手iPhone 128G 深空灰 成色新 无拆修',
      '低价转让 iPhone 二手机 原装配件齐全'
    ],
    tags: ['手机', 'iPhone', '二手电子', '95新', '原装配件'],
    priceEstimate: {
      min: 1800,
      max: 2500
    }
  }

  // 根据分类生成不同的内容
  if (category && category.includes('书籍')) {
    result = {
      description: '这是一本品相良好的二手书籍，书角略有磨损，内页干净无笔记，适合爱书人士收藏。',
      titleSuggestions: [
        '九成新 畅销小说 无划线无笔记',
        '二手图书 经典文学作品 品相佳',
        '特价处理 正版书籍 仅阅读一次'
      ],
      tags: ['书籍', '二手书', '文学', '小说', '品相好'],
      priceEstimate: {
        min: 15,
        max: 45
      }
    }
  } else if (category && category.includes('服装')) {
    result = {
      description: '这是一件时尚的二手服装，面料舒适，款式新颖，仅穿着过几次，无明显瑕疵，非常适合日常搭配。',
      titleSuggestions: [
        '95新 时尚服饰 男女可穿 尺码M',
        '仅穿几次 品牌服装 原价299',
        '闲置服饰 面料舒适 无瑕疵'
      ],
      tags: ['服装', '二手衣物', '时尚', '舒适', '九成新'],
      priceEstimate: {
        min: 50,
        max: 120
      }
    }
  } else if (category && category.includes('电脑')) {
    result = {
      description: '这台二手笔记本电脑性能强劲，配置为i7处理器、16GB内存和512GB固态硬盘，能够流畅运行各类办公和设计软件。外观保养得当，机身干净整洁，键盘按键回弹良好，无异响。',
      titleSuggestions: [
        '9成新 高配笔记本电脑 i7处理器 16G内存 512G固态',
        '二手笔记本 性能强劲 轻薄便携 适合办公游戏',
        '高端商务本 成色好 无拆修 带正版系统'
      ],
      tags: ['电脑', '笔记本', '高配置', 'i7处理器', '大内存', '游戏本'],
      priceEstimate: {
        min: 2800,
        max: 4500
      }
    }
  }

  return mockDelayResponse({
    code: 200,
    message: '图片分析成功',
    data: result
  }, 1000)
})

// 模拟内容生成
Mock.mock(/\/api\/ai\/generate-content/, 'post', (options) => {
  const { body } = options
  const params = JSON.parse(body)
  const { type, category, condition } = params

  let content = ''

  // 根据类型生成不同内容
  if (type === 'description') {
    if (category && category.includes('手机')) {
      content = `这款二手手机保存完好，外观接近全新，仅有轻微使用痕迹，不影响美观。\n\n屏幕无划痕，显示效果清晰锐利，色彩还原准确。电池健康度保持在90%以上，续航能力强。\n\n系统已重置至出厂设置，运行流畅无卡顿。所有功能正常工作，包括摄像头、扬声器和各种传感器。\n\n随机附送原装充电器和数据线，保修卡和发票已遗失。出售原因是已购入新机型，特此转让给需要的朋友。`
    } else if (category && category.includes('电脑')) {
      content = `这台二手笔记本电脑性能强劲，配置为i7处理器、16GB内存和512GB固态硬盘，能够流畅运行各类办公和设计软件。\n\n外观保养得当，机身干净整洁，键盘按键回弹良好，无异响。屏幕显示效果出色，色彩准确，无坏点和亮点。\n\n电池循环次数较少，单次充电可持续使用约5-6小时。系统已重装，运行稳定高效。\n\n随机附送原装电源适配器和笔记本内胆包。因工作需要升级更高配置设备，故出售此机。`
    } else {
      content = `这件二手商品保存完好，外观接近${condition || "九成新"}，仅有极少量使用痕迹，整体状态优良。\n\n商品所有功能均正常工作，性能稳定可靠，使用感受与新品相差无几。\n\n商品曾经在正规渠道购买，质量有保证。因个人闲置，现低价转让，希望能找到合适的新主人。\n\n如有任何疑问，欢迎随时咨询，可提供更多细节图片和使用视频。`
    }
  } else if (type === 'title') {
    if (category && category.includes('手机')) {
      content = `${condition || "95新"} 全网通 智能手机 大内存 长续航 功能完好 无拆修`
    } else if (category && category.includes('电脑')) {
      content = `${condition || "9成新"} 高配笔记本电脑 i7处理器 16G内存 512G固态 性能强劲`
    } else {
      content = `${condition || "9成新"}二手商品 品质保证 功能完好 低价转让 诚信交易`
    }
  } else if (type === 'tags') {
    if (category && category.includes('手机')) {
      content = `二手手机,智能手机,高性价比,${condition || "95新"},全网通,大内存,长续航,无拆修`
    } else if (category && category.includes('电脑')) {
      content = `二手笔记本,高配置,i7处理器,16G内存,512G固态,性能强劲,轻薄本,办公本`
    } else {
      content = `二手商品,闲置转让,${condition || "九成新"}成色,品质保证,低价出售,功能完好,诚信交易`
    }
  }

  return mockDelayResponse({
    code: 200,
    message: '内容生成成功',
    data: {
      content
    }
  }, 1500)
})

// 模拟标签生成
Mock.mock(/\/api\/ai\/generate-tags/, 'post', (options) => {
  const { body } = options
  const params = JSON.parse(body)
  const { category } = params

  let tags = ['二手商品', '闲置转让', '九成新', '品质保证', '低价出售', '功能完好']

  if (category && category.includes('手机')) {
    tags = ['二手手机', '智能手机', '高性价比', '95新', '全网通', '大内存', '长续航', '无拆修']
  } else if (category && category.includes('电脑')) {
    tags = ['二手笔记本', '高配置', 'i7处理器', '16G内存', '512G固态', '性能强劲', '轻薄本', '办公本']
  } else if (category && category.includes('书籍')) {
    tags = ['二手书籍', '畅销小说', '无笔记', '品相好', '正版图书', '特价图书', '经典文学']
  } else if (category && category.includes('服装')) {
    tags = ['二手服装', '时尚服饰', '九成新', '品牌服装', '舒适面料', '男女可穿', '休闲服饰']
  }

  return mockDelayResponse({
    code: 200,
    message: '标签生成成功',
    data: {
      tags
    }
  }, 800)
})

// 模拟价格估算
Mock.mock(/\/api\/ai\/estimate-price/, 'post', (options) => {
  const { body } = options
  const params = JSON.parse(body)
  const { category, condition } = params

  let priceEstimate = {
    min: 100,
    max: 300,
    recommended: 200
  }

  if (category && category.includes('手机')) {
    priceEstimate = {
      min: 1800,
      max: 2500,
      recommended: 2200
    }
  } else if (category && category.includes('电脑')) {
    priceEstimate = {
      min: 2800,
      max: 4500,
      recommended: 3600
    }
  } else if (category && category.includes('书籍')) {
    priceEstimate = {
      min: 15,
      max: 45,
      recommended: 30
    }
  } else if (category && category.includes('服装')) {
    priceEstimate = {
      min: 50,
      max: 120,
      recommended: 80
    }
  }

  // 根据成色调整价格
  if (condition && condition.includes('全新')) {
    priceEstimate.min = Math.floor(priceEstimate.min * 1.2)
    priceEstimate.max = Math.floor(priceEstimate.max * 1.2)
    priceEstimate.recommended = Math.floor(priceEstimate.recommended * 1.2)
  } else if (condition && condition.includes('8成新')) {
    priceEstimate.min = Math.floor(priceEstimate.min * 0.8)
    priceEstimate.max = Math.floor(priceEstimate.max * 0.8)
    priceEstimate.recommended = Math.floor(priceEstimate.recommended * 0.8)
  } else if (condition && condition.includes('7成新')) {
    priceEstimate.min = Math.floor(priceEstimate.min * 0.7)
    priceEstimate.max = Math.floor(priceEstimate.max * 0.7)
    priceEstimate.recommended = Math.floor(priceEstimate.recommended * 0.7)
  }

  return mockDelayResponse({
    code: 200,
    message: '价格估算成功',
    data: {
      priceEstimate
    }
  }, 1200)
})

// 模拟商品信息优化
Mock.mock(/\/api\/ai\/optimize-product/, 'post', (options) => {
  const { body } = options
  const params = JSON.parse(body)
  const { category, condition } = params

  let optimizedInfo = {
    title: '商品标题优化版',
    description: '商品描述优化版，更加生动详细，突出卖点，提升吸引力。',
    tags: ['优化标签1', '优化标签2', '优化标签3', '优化标签4', '优化标签5'],
    priceEstimate: {
      min: 100,
      max: 300,
      recommended: 200
    }
  }

  if (category && category.includes('手机')) {
    optimizedInfo = {
      title: `${condition || "95新"} 全网通高性能智能手机 内存大 电池耐用 无拆修无暗病`,
      description: `这款二手手机品相极佳，外观几乎完美，仅在充电口有极其细微的使用痕迹，整体接近${condition || "95新"}。\n\n屏幕显示效果出色，色彩鲜艳，对比度强，无任何烧屏或坏点现象。电池健康度维持在95%以上，重度使用仍可持续一整天。\n\n系统运行流畅稳定，所有功能完好，包括Face ID/指纹识别、摄像头、扬声器等。拍照效果清晰锐利，夜间模式表现出色。\n\n全套配件齐全，包含原装充电器、数据线、耳机和保护壳。本机由专柜购入，曾精心保养，因换新机而出售，绝非翻新或拆修机。\n\n支持当面交易和验机，非诚勿扰。`,
      tags: ['二手手机', '高性能', `${condition || "95新"}`, '全网通', '大内存', '长续航', '无拆修', '原装正品', '性价比高'],
      priceEstimate: {
        min: 1800,
        max: 2500,
        recommended: 2200
      }
    }
  } else if (category && category.includes('电脑')) {
    optimizedInfo = {
      title: `${condition || "9成新"} 轻薄高性能笔记本电脑 i7+16G+512G 性能强劲 外观如新`,
      description: `这台二手笔记本外观接近${condition || "9成新"}，无明显划痕和磨损，整体品相极佳。\n\n顶级配置：搭载第11代i7处理器、16GB大内存和512GB超高速固态硬盘，尤其适合设计、剪辑、办公等多任务处理，运行流畅无卡顿。\n\n轻薄机身设计，携带便捷；15.6英寸高清IPS屏幕，色彩准确，观看角度宽广；背光键盘手感舒适，提供极佳的打字体验。\n\n电池循环次数少，续航能力强，单次充电可持续使用6-8小时。预装正版Win11系统及办公软件，即开即用。\n\n附赠原装电源、高级电脑包和无线鼠标。因升级更高配设备出售，支持专业测试和验机。`,
      tags: ['二手笔记本', '高配置', 'i7处理器', '16G内存', '512G固态', '轻薄本', '大屏幕', '长续航', '游戏本', '设计本'],
      priceEstimate: {
        min: 2800,
        max: 4500,
        recommended: 3600
      }
    }
  }

  return mockDelayResponse({
    code: 200,
    message: '商品信息优化成功',
    data: optimizedInfo
  }, 2000)
})