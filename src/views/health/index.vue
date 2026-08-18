<template>
  <div class="health-page">
    <van-nav-bar title="健康档案" fixed placeholder safe-area-inset-top />

    <!-- 录入 -->
    <van-form @submit="onSubmit">
      <van-cell-group inset title="录入健康数据">
        <van-field
          v-model="form.systolic"
          type="number"
          label="收缩压"
          placeholder="30-250 mmHg"
          :rules="[{ validator: optionalNum, message: '收缩压需为 30-250 的数值', range: [30, 250] }]"
        />
        <van-field
          v-model="form.diastolic"
          type="number"
          label="舒张压"
          placeholder="30-150 mmHg"
          :rules="[{ validator: optionalNum, message: '舒张压需为 30-150 的数值', range: [30, 150] }]"
        />
        <van-field
          v-model="form.bloodSugar"
          type="number"
          label="空腹血糖"
          placeholder="1.0-30.0 mmol/L"
          :rules="[{ validator: optionalNum, message: '空腹血糖需为 1-30 的数值', range: [1, 30] }]"
        />
        <van-field
          v-model="form.heartRate"
          type="number"
          label="心率"
          placeholder="20-250 次/分"
          :rules="[{ validator: optionalNum, message: '心率需为 20-250 的数值', range: [20, 250] }]"
        />
        <van-field
          v-model="form.weight"
          type="number"
          label="体重"
          placeholder="10.0-300.0 kg"
          :rules="[{ validator: optionalNum, message: '体重需为 10-300 的数值', range: [10, 300] }]"
        />
        <van-field
          v-model="form.memo"
          label="备注"
          placeholder="选填，如：晨起测量"
          maxlength="500"
        />
      </van-cell-group>
      <div class="record-actions">
        <van-button round block type="primary" native-type="submit" :loading="submitting">保存记录</van-button>
      </div>
    </van-form>

    <!-- 历史记录 -->
    <van-cell-group inset title="历史记录">
      <van-cell
        v-for="r in list"
        :key="r.id"
        :title="`${r.systolic ?? '-'}/${r.diastolic ?? '-'} mmHg · ${r.bloodSugar ?? '-'} 血糖`"
        :label="`心率 ${r.heartRate ?? '-'} · 体重 ${r.weight ?? '-'}kg · BMI ${r.bmi ?? '-'} · ${r.memo || ''}`"
      >
        <template #value>
          <span class="record-time">{{ formatDateTime(r.recordedTime) }}</span>
        </template>
      </van-cell>
      <van-empty v-if="!list.length && !loading" description="暂无健康记录" image-size="80" />
      <div v-if="total > list.length" class="load-more" @click="loadMore">加载更多</div>
    </van-cell-group>

    <!-- 近 6 月趋势 -->
    <van-cell-group inset title="近 6 月趋势" v-if="trendEntries.length">
      <van-collapse v-model="activeNames">
        <van-collapse-item v-for="t in trendEntries" :key="t.indicator" :title="t.indicatorText" :name="t.indicator">
          <div class="trend-row" v-for="p in t.points" :key="p.month">
            <span>{{ p.month }}</span>
            <span>均值 {{ p.avg }}</span>
            <span>最高 {{ p.max }}</span>
            <span>最低 {{ p.min }}</span>
          </div>
        </van-collapse-item>
      </van-collapse>
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { recordHealth, getHealthHistory, getHealthTrend } from '../../api/health'
import { formatDateTime } from '../../utils/format'

const INDICATOR_TEXT = {
  SYSTOLIC: '收缩压', DIASTOLIC: '舒张压', BLOOD_SUGAR: '空腹血糖', HEART_RATE: '心率', BMI: 'BMI'
}

const submitting = ref(false)
const form = reactive({ systolic: '', diastolic: '', bloodSugar: '', heartRate: '', weight: '', memo: '' })

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 10 })

const activeNames = ref([])
const trendEntries = ref([])

// 可选数字校验：为空则通过，非空需在范围内
function optionalNum(val, rule) {
  if (val === '' || val === null || val === undefined) return true
  const n = Number(val)
  const [min, max] = rule && rule.range
  if (min === undefined || max === undefined) return !Number.isNaN(n)
  return !Number.isNaN(n) && n >= min && n <= max
}

async function onSubmit() {
  // 至少填一项
  const fields = [form.systolic, form.diastolic, form.bloodSugar, form.heartRate, form.weight]
  if (!fields.some((f) => f !== '' && f !== null && f !== undefined)) {
    return showFailToast('请至少填写一项健康指标')
  }
  submitting.value = true
  try {
    await recordHealth(form)
    showSuccessToast('保存成功')
    Object.assign(form, { systolic: '', diastolic: '', bloodSugar: '', heartRate: '', weight: '', memo: '' })
    query.page = 1
    loadHistory()
  } finally {
    submitting.value = false
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await getHealthHistory({ page: query.page, size: query.size })
    if (query.page === 1) {
      list.value = data.list || []
    } else {
      list.value = list.value.concat(data.list || [])
    }
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function loadMore() {
  query.page += 1
  loadHistory()
}

async function loadTrend() {
  try {
    const d = await getHealthTrend()
    const map = (d && d.data) || {}
    trendEntries.value = Object.keys(map).map((indicator) => ({
      indicator,
      indicatorText: INDICATOR_TEXT[indicator] || indicator,
      points: map[indicator] || []
    }))
  } catch {
    trendEntries.value = []
  }
}

onMounted(() => {
  loadHistory()
  loadTrend()
})
</script>

<style scoped>
.health-page {
  background: var(--page-bg);
  min-height: 100vh;
  padding-bottom: 70px;
}
.health-page :deep(.van-cell-group--inset) {
  box-shadow: var(--card-shadow);
}
.record-actions {
  margin: 6px 20px 16px;
}
.record-actions :deep(.van-button) {
  height: 50px;
  font-size: 17px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(232, 132, 60, 0.3);
}
.record-time {
  color: var(--text-dim);
  font-size: 13px;
}
/* 趋势数据行：分列清晰 */
.trend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 16px;
  font-size: 15px;
  color: var(--text-sub);
  background: var(--brand-bg);
  border-radius: 8px;
  margin: 6px 12px;
}
.trend-row span:first-child {
  font-weight: 600;
  color: var(--text-main);
}
</style>
