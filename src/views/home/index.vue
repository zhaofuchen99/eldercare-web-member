<template>
  <div class="home-page">
    <!-- 顶部欢迎卡 -->
    <div class="home-hero">
      <div class="hero-top">
        <div class="hero-user">
          <van-image round width="52" height="52" :src="avatar" class="hero-avatar">
            <template #error>
              <div class="avatar-fallback">🧓</div>
            </template>
          </van-image>
          <div>
            <div class="hero-name">{{ displayName }}</div>
            <div class="hero-level">
              <van-tag round color="#fff5ea" text-color="#d97c2b">{{ levelText }}</van-tag>
              <span class="hero-status">已认证</span>
            </div>
          </div>
        </div>
        <div class="hero-points" @click="goPoints">
          <div class="points-num">{{ auth.points }}</div>
          <div class="points-label">我的积分</div>
        </div>
      </div>
      <div class="hero-msg" @click="goMessages">
        <van-icon name="bell" />
        <span>消息中心</span>
        <van-badge v-if="unread > 0" :content="unread > 99 ? '99+' : unread" class="msg-badge" />
      </div>
    </div>

    <!-- 功能宫格 -->
    <van-grid :border="false" :column-num="3" class="home-grid">
      <van-grid-item icon="chat-o" text="AI 助手" @click="go('/chat')" />
      <van-grid-item icon="todo-list-o" text="健康评测" @click="go('/assessment')" />
      <van-grid-item icon="shop-o" text="体检预约" @click="go('/appointment')" />
      <van-grid-item icon="calendar-o" text="我的预约" @click="go('/appointment/mine')" />
      <van-grid-item icon="bar-chart-o" text="健康档案" @click="go('/health')" />
      <van-grid-item icon="gem-o" text="积分明细" @click="go('/points')" />
    </van-grid>
    <!-- 最近健康记录 -->
    <van-cell-group inset class="home-last">
      <van-cell title="最近健康记录" is-link @click="go('/health')">
        <template #value>
          <span v-if="lastRecord" class="last-time">{{ formatDate(lastRecord.recordedTime) }}</span>
        </template>
      </van-cell>
      <template v-if="lastRecord">
        <van-cell title="血压" :value="`${lastRecord.systolic ?? '-'}/${lastRecord.diastolic ?? '-'} mmHg`" />
        <van-cell title="血糖" :value="lastRecord.bloodSugar ? `${lastRecord.bloodSugar} mmol/L` : '-'" />
        <van-cell title="心率" :value="lastRecord.heartRate ? `${lastRecord.heartRate} 次/分` : '-'" />
        <van-cell title="BMI" :value="lastRecord.bmi ?? '-'" />
      </template>
      <van-cell v-else title="暂无记录" label="点击「健康」页开始录入吧" />
    </van-cell-group>

    <div class="empty-pad" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile } from '../../api/auth'
import { getUnreadCount } from '../../api/message'
import { getHealthHistory } from '../../api/health'
import { useAuthStore } from '../../store/auth'
import { formatDate, enumText } from '../../utils/format'

const router = useRouter()
const auth = useAuthStore()

const unread = ref(0)
const lastRecord = ref(null)

const displayName = computed(() => auth.realName || auth.phone)
const levelText = computed(() => enumText('memberLevel', auth.memberLevel))
const avatar = computed(() => auth.userInfo?.avatar || '')

function go(path) {
  router.push(path)
}

function goPoints() {
  router.push('/points')
}

function goMessages() {
  router.push('/message')
}

onMounted(async () => {
  try {
    // 刷新最新资料与积分
    const profile = await getProfile()
    auth.setUserInfo(profile)
  } catch {
    /* 忽略 */
  }
  try {
    const d = await getUnreadCount()
    unread.value = d.unread || 0
  } catch {
    /* 忽略 */
  }
  try {
    const data = await getHealthHistory({ page: 1, size: 1 })
    lastRecord.value = data.list?.[0] || null
  } catch {
    /* 忽略 */
  }
})
</script>

<style scoped>
.home-page {
  background: var(--page-bg);
  min-height: 100vh;
}
.home-hero {
  padding: 22px 16px 20px;
  background: var(--brand-gradient);
  border-radius: 0 0 24px 24px;
  color: #fff;
  box-shadow: 0 6px 18px rgba(232, 132, 60, 0.22);
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hero-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.avatar-fallback {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.hero-name {
  font-size: 21px;
  font-weight: 700;
}
.hero-level {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero-status {
  font-size: 13px;
  opacity: 0.9;
}
.hero-points {
  text-align: right;
  cursor: pointer;
}
.points-num {
  font-size: 28px;
  font-weight: 700;
}
.points-label {
  font-size: 13px;
  opacity: 0.92;
}
.hero-msg {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 22px;
  padding: 10px 16px;
  cursor: pointer;
}
.hero-msg:active {
  background: rgba(255, 255, 255, 0.32);
}
.msg-badge {
  margin-left: auto;
}
/* 功能宫格：悬浮卡片式 */
.home-grid {
  margin: 14px var(--page-pad) 0;
  background: var(--card-bg);
  border-radius: var(--radius-card);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}
.home-grid :deep(.van-grid-item) {
  padding: 16px 0 14px;
}
.home-grid :deep(.van-grid-item__content) {
  background: transparent;
}
.home-grid :deep(.van-grid-item__content:active) {
  background: var(--brand-bg);
}
.home-grid :deep(.van-grid-item__icon) {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}
.home-grid :deep(.van-grid-item__icon .van-icon) {
  font-size: 24px;
  color: var(--brand-deep);
}
.home-grid :deep(.van-grid-item__text) {
  font-size: 15px;
  color: var(--text-main);
  margin-top: 2px;
}
/* 最近健康记录卡片 */
.home-last {
  margin-top: 14px;
  box-shadow: var(--card-shadow);
}
.home-last :deep(.van-cell-group__title) {
  color: var(--brand-deep);
  font-weight: 600;
}
.last-time {
  color: var(--text-dim);
  font-size: 13px;
}
</style>
