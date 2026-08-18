<template>
  <div class="points-page">
    <van-nav-bar title="积分明细" left-arrow @click-left="$router.back()" fixed placeholder safe-area-inset-top />

    <div class="points-hero">
      <div class="points-hero-label">当前积分</div>
      <div class="points-hero-num">{{ auth.points }}</div>
      <div class="points-hero-tip">获得积分 1 年内有效，按先进先出消费</div>
    </div>

    <div class="page-content">
      <van-empty v-if="!list.length && !loading" description="暂无积分流水" image-size="80" />
      <div v-for="p in list" :key="p.id" class="tx-card">
        <div class="tx-main">
          <div class="tx-type">{{ typeText(p.type) }}</div>
          <div class="tx-desc">{{ p.description || '积分变动' }}</div>
          <div class="tx-time">
            {{ formatDateTime(p.createTime) }}
            <span v-if="p.expireTime" class="tx-expire">有效期至 {{ formatDate(p.expireTime) }}</span>
          </div>
        </div>
        <div class="tx-amount" :class="p.changeAmount >= 0 ? 'plus' : 'minus'">
          {{ p.changeAmount >= 0 ? '+' : '' }}{{ p.changeAmount }}
        </div>
      </div>

      <div v-if="total > list.length" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPoints } from '../../api/points'
import { useAuthStore } from '../../store/auth'
import { formatDateTime, formatDate } from '../../utils/format'

const auth = useAuthStore()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 20 })

const TX_TYPE = {
  REGISTER_BONUS: '注册赠送',
  ASSESSMENT_COMPLETE: '评测完成',
  ACTIVITY_CHECKIN: '活动签到',
  APPOINTMENT_CONSUME: '体检预约消费',
  APPOINTMENT_REFUND: '预约取消退还',
  ADMIN_ADJUST: '管理员调整',
  EXPIRE: '过期清除'
}

function typeText(t) {
  return TX_TYPE[t] || t || '-'
}

async function load() {
  loading.value = true
  try {
    const data = await getPoints({ page: query.page, size: query.size })
    if (query.page === 1) list.value = data.list || []
    else list.value = list.value.concat(data.list || [])
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function loadMore() {
  query.page += 1
  load()
}

onMounted(load)
</script>

<style scoped>
.points-hero {
  padding: 26px 20px;
  background: linear-gradient(135deg, #f4a259 0%, #e8843c 100%);
  color: #fff;
  text-align: center;
}
.points-hero-label {
  font-size: 14px;
  opacity: 0.95;
}
.points-hero-num {
  margin-top: 6px;
  font-size: 46px;
  font-weight: 700;
}
.points-hero-tip {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.85;
}
.tx-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.tx-type {
  font-size: 15px;
  font-weight: 600;
}
.tx-desc {
  margin-top: 3px;
  font-size: 13px;
  color: #646566;
}
.tx-time {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}
.tx-expire {
  margin-left: 8px;
  color: #c8c9cc;
}
.tx-amount {
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}
.tx-amount.plus {
  color: #d97c2b;
}
.tx-amount.minus {
  color: #646566;
}
.load-more {
  padding: 14px;
  text-align: center;
  color: #576b95;
  font-size: 14px;
}
</style>
