/** 日期格式化为 yyyy-MM-dd HH:mm:ss */
export function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 日期格式化为 yyyy-MM-dd */
export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 枚举编码 → 中文映射（数据库存英文编码，前端展示层映射中文） */
export const enumMaps = {
  memberLevel: {
    NORMAL: '普通', SILVER: '白银', GOLD: '黄金', PLATINUM: '铂金', DIAMOND: '钻石'
  },
  userStatus: { ENABLED: '启用', DISABLED: '禁用' },
  appointmentStatus: {
    PENDING: '待确认', CONFIRMED: '已确认', CANCELED: '已取消', COMPLETED: '已完成'
  },
  activityStatus: {
    DRAFT: '草稿', REGISTRATING: '报名中', IN_PROGRESS: '进行中', ENDED: '已结束'
  },
  messageType: {
    APPOINTMENT: '预约通知', ACTIVITY: '活动通知', SYSTEM: '系统消息', HEALTH_REMINDER: '健康提醒'
  },
  checkInStatus: { NOT_CHECKED_IN: '未签到', CHECKED_IN: '已签到' },
  questionType: { SINGLE: '单选', MULTIPLE: '多选', TEXT: '文本' }
}

/** 取枚举中文；映射不到返回原值 */
export function enumText(mapKey, value) {
  const map = enumMaps[mapKey]
  if (!map) return value ?? '-'
  return map[value] ?? value ?? '-'
}

/** 性别：M/1/男 → 男，F/0/女 → 女，其它原值 */
export function genderText(v) {
  if (v === 'M' || v === '1' || v === '男') return '男'
  if (v === 'F' || v === '0' || v === '女') return '女'
  return v || '-'
}
