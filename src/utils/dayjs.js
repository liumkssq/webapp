import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'
import updateLocale from 'dayjs/plugin/updateLocale'
import 'dayjs/locale/zh-cn'

// 扩展 dayjs 插件
dayjs.extend(relativeTime)
dayjs.extend(calendar)
dayjs.extend(updateLocale)

// 设置中文语言
dayjs.locale('zh-cn')

// 更新本地化配置
dayjs.updateLocale('zh-cn', {
  relativeTime: {
    future: '%s内',
    past: '%s前',
    s: '几秒',
    m: '1分钟',
    mm: '%d分钟',
    h: '1小时',
    hh: '%d小时',
    d: '1天',
    dd: '%d天',
    M: '1个月',
    MM: '%d个月',
    y: '1年',
    yy: '%d年'
  }
})

export default dayjs