<template>
  <div class="appt-list-page">
    <van-nav-bar title="体检预约" left-arrow @click-left="$router.back()" fixed placeholder safe-area-inset-top />
    <div class="page-content">
      <van-notice-bar
        left-icon="info-o"
        text="预约需消耗积分（按套餐积分价 FIFO 扣减），取消预约将自动退还"
      />
      <van-cell title="我的预约" is-link icon="calendar-o" @click="goMine" class="mine-link" />

      <van-skeleton title :row="3" v-if="loading" />
      <van-empty v-else-if="!list.length" description="暂无可预约套餐" image-size="80" />

      <div v-for="p in list" :key="p.id" class="pkg-card" @click="goBook(p)">
        <div class="pkg-head">
          <div class="pkg-name">{{ p.name }}</div>
          <div class="pkg-price"><span class="price-icon">🪙</span> {{ p.price }}</div>
        </div>
        <div v-if="p.suitablePeople" class="pkg-line">适合：{{ p.suitablePeople }}</div>
        <div v-if="p.description" class="pkg-line dim">{{ p.description }}</div>
        <div v-if="p.items && p.items.length" class="pkg-items">
          <van-tag v-for="(it, i) in p.items" :key="i" round plain color="#e8843c" class="pkg-tag">{{ it }}</van-tag>
        </div>
        <div class="pkg-footer">
          <van-button size="small" round type="primary">选择时段预约</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPackages } from '../../api/appointment'

const router = useRouter()
const loading = ref(false)
const list = ref([])

function goBook(p) {
  router.push({ path: `/appointment/book/${p.id}`, query: { name: p.name } })
}

function goMine() {
  router.push('/appointment/mine')
}

onMounted(async () => {
  loading.value = true
  try {
    list.value = await getPackages()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.mine-link {
  margin: 10px 0;
  border-radius: 10px;
}
.pkg-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.pkg-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pkg-name {
  font-size: 17px;
  font-weight: 600;
}
.pkg-price {
  color: #d97c2b;
  font-size: 18px;
  font-weight: 700;
}
.price-icon {
  font-size: 14px;
}
.pkg-line {
  margin-top: 6px;
  font-size: 13px;
  color: #646566;
  line-height: 1.6;
}
.pkg-line.dim {
  color: #969799;
}
.pkg-items {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pkg-tag {
  padding: 0 8px;
}
.pkg-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
