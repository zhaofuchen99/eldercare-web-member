<template>
  <div class="activity-page">
    <van-nav-bar title="社区活动" fixed placeholder safe-area-inset-top />
    <van-tabs v-model="tab" sticky offset-top="46">
      <van-tab title="活动广场" name="square">
        <div class="act-list">
          <van-skeleton title :row="3" v-if="loading" />
          <van-empty v-else-if="!list.length" description="暂无活动" image-size="80" />
          <div v-for="a in list" :key="a.id" class="act-card" @click="openDetail(a)">
            <div class="act-main">
              <div class="act-title">{{ a.title }}</div>
              <div class="act-content" v-if="a.content">{{ a.content }}</div>
              <div class="act-meta">
                <van-icon name="location-o" class="meta-icon" /> {{ a.location || '未设置地点' }}
              </div>
              <div class="act-meta">
                <van-icon name="clock-o" class="meta-icon" />
                活动时间：{{ fmt(a.activityStartTime) }} ~ {{ fmtTime(a.activityEndTime) }}
              </div>
              <div class="act-meta dim">
                <van-icon name="underway-o" class="meta-icon" />
                报名：{{ fmt(a.registrationStartTime) }} ~ {{ fmtTime(a.registrationEndTime) }}
              </div>
            </div>
            <div class="act-right">
              <van-tag :type="statusType(a.status)">{{ enumText('activityStatus', a.status) }}</van-tag>
              <div class="act-count">{{ a.currentParticipants || 0 }}/{{ a.maxParticipants || '不限' }}</div>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab title="我的活动" name="mine">
        <div class="act-list">
          <van-empty v-if="!mineList.length" description="还没有报名活动" image-size="80" />
          <div v-for="m in mineList" :key="m.id" class="act-card">
            <div class="act-main">
              <div class="act-title">{{ m.title }}</div>
              <div class="act-meta">
                <van-icon name="location-o" class="meta-icon" /> {{ m.location || '未设置地点' }}
              </div>
              <div class="act-meta">
                <van-icon name="clock-o" class="meta-icon" /> {{ fmt(m.activityStartTime) }} ~ {{ fmtTime(m.activityEndTime) }}
              </div>
            </div>
            <div class="act-right">
              <van-tag :type="statusType(m.activityStatus)">{{ enumText('activityStatus', m.activityStatus) }}</van-tag>
              <van-tag :type="m.checkInStatus === 'CHECKED_IN' ? 'success' : 'default'" class="checkin-tag">
                {{ enumText('checkInStatus', m.checkInStatus) }}
              </van-tag>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 活动详情弹层 -->
    <van-popup v-model:show="detailVisible" position="bottom" round style="max-height: 80vh">
      <div class="detail-pop" v-if="detail">
        <div class="detail-title">{{ detail.title }}</div>
        <div class="detail-meta">
          <div class="detail-meta-row">
            <van-icon name="location-o" class="meta-icon" /><span>{{ detail.location || '未设置地点' }}</span>
          </div>
          <div class="detail-meta-row">
            <van-icon name="clock-o" class="meta-icon" /><span>{{ fmt(detail.activityStartTime) }} ~ {{ fmtTime(detail.activityEndTime) }}</span>
          </div>
          <div class="detail-meta-row">
            <van-icon name="underway-o" class="meta-icon" /><span>报名期 {{ fmt(detail.registrationStartTime) }} ~ {{ fmtTime(detail.registrationEndTime) }}</span>
          </div>
          <div class="detail-meta-row">
            <van-icon name="people-o" class="meta-icon" /><span>名额 {{ detail.maxParticipants || '不限' }}，已报名 {{ detail.currentParticipants || 0 }}</span>
          </div>
        </div>
        <div class="detail-content">{{ detail.content || '暂无详细内容' }}</div>
        <div class="detail-actions">
          <van-button
            round
            block
            type="primary"
            :loading="acting"
            :disabled="!canRegister"
            @click="doRegister"
          >
            {{ registerBtnText }}
          </van-button>
          <van-button
            v-if="checkinStatus?.registered && canCheckin"
            round
            block
            type="success"
            :loading="acting"
            @click="doCheckin"
            style="margin-top: 10px"
          >
            活动签到（+50 积分）
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import {
  getActivities,
  getActivityDetail,
  registerActivity,
  getMyActivities,
  getCheckinStatus,
  checkinActivity
} from '../../api/activity'
import { useAuthStore } from '../../store/auth'
import { enumText } from '../../utils/format'

const auth = useAuthStore()
const tab = ref('square')
const loading = ref(false)
const list = ref([])
const mineList = ref([])

const detailVisible = ref(false)
const detail = ref(null)
const checkinStatus = ref(null)
const acting = ref(false)

const INDICATOR_DATE = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })

function fmt(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function fmtTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function statusType(s) {
  return { DRAFT: 'default', REGISTRATING: 'primary', IN_PROGRESS: 'success', ENDED: 'default' }[s] || 'default'
}

const canRegister = computed(() => {
  if (!detail.value) return false
  const s = detail.value.status
  if (s !== 'REGISTRATING') return false
  const now = Date.now()
  const start = new Date(detail.value.registrationStartTime).getTime()
  const end = new Date(detail.value.registrationEndTime).getTime()
  return now >= start && now <= end
})

const registerBtnText = computed(() => {
  if (!detail.value) return ''
  if (checkinStatus.value?.registered) return '已报名'
  if (detail.value.status === 'REGISTRATING') return canRegister.value ? '立即报名' : '报名未开始/已结束'
  if (detail.value.status === 'IN_PROGRESS') return '活动进行中'
  if (detail.value.status === 'ENDED') return '活动已结束'
  return '暂未开放'
})

const canCheckin = computed(() => {
  if (!detail.value) return false
  const s = detail.value.status
  if (s !== 'IN_PROGRESS') return false
  const now = Date.now()
  const start = new Date(detail.value.activityStartTime).getTime()
  const end = new Date(detail.value.activityEndTime).getTime()
  return now >= start && now <= end && checkinStatus.value?.checkInStatus !== 'CHECKED_IN'
})

async function loadSquare() {
  loading.value = true
  try {
    list.value = await getActivities()
  } finally {
    loading.value = false
  }
}

async function loadMine() {
  try {
    const data = await getMyActivities({ page: 1, size: 50 })
    mineList.value = data.list || []
  } catch {
    /* 忽略 */
  }
}

async function openDetail(a) {
  detailVisible.value = true
  detail.value = a
  checkinStatus.value = null
  try {
    detail.value = await getActivityDetail(a.id)
    checkinStatus.value = await getCheckinStatus(a.id)
  } catch {
    /* 拦截器已提示 */
  }
}

async function doRegister() {
  acting.value = true
  try {
    await registerActivity(detail.value.id)
    showSuccessToast('报名成功')
    detailVisible.value = false
    await Promise.all([loadSquare(), loadMine()])
  } finally {
    acting.value = false
  }
}

async function doCheckin() {
  acting.value = true
  try {
    await checkinActivity(detail.value.id)
    showSuccessToast('签到成功，+50 积分')
    detailVisible.value = false
    await Promise.all([loadSquare(), loadMine()])
    try {
      const { getProfile } = await import('../../api/auth')
      const profile = await getProfile()
      auth.setUserInfo(profile)
    } catch {
      /* 忽略 */
    }
  } finally {
    acting.value = false
  }
}

onMounted(() => {
  loadSquare()
  loadMine()
})
</script>

<style scoped>
.activity-page {
  background: var(--page-bg);
  min-height: 100vh;
}
.act-list {
  padding: 12px 14px 70px;
}
.act-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-radius: var(--radius-card);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--card-shadow);
}
.act-main {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}
.act-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}
.act-content {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.act-meta {
  font-size: 14px;
  color: var(--text-sub);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.act-meta .meta-icon {
  color: var(--brand-deep);
}
.act-meta.dim {
  color: var(--text-dim);
  font-size: 13px;
}
.act-meta.dim .meta-icon {
  color: var(--text-dim);
}
.act-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.act-count {
  font-size: 13px;
  color: var(--text-dim);
}
.checkin-tag {
  margin-top: 2px;
}
/* 活动详情弹层 */
.detail-pop {
  padding: 24px 20px 30px;
}
.detail-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
  line-height: 1.4;
}
.detail-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--text-sub);
  margin-bottom: 10px;
}
.detail-meta-row .meta-icon {
  color: var(--brand-deep);
  font-size: 17px;
}
.detail-content {
  margin-top: 12px;
  padding: 14px;
  background: var(--brand-bg);
  border-radius: 10px;
  font-size: 15px;
  color: var(--text-main);
  line-height: 1.8;
  white-space: pre-wrap;
  max-height: 30vh;
  overflow: auto;
}
.detail-actions {
  margin-top: 20px;
}
.detail-actions :deep(.van-button) {
  height: 50px;
  font-size: 17px;
  font-weight: 600;
}
</style>
