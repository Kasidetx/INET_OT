<template>
  <div>
    <v-row v-if="stats" class="mb-6">
      <v-col v-for="stat in stats" :key="stat.id" cols="12" sm="4" md="2" class="pa-2">
        <v-card outlined class="rounded-xl pa-4 stat-card d-flex align-center justify-space-between"
          :class="{ 'active-stat-card': activeId === stat.id }" @click="$emit('click-stat', stat)">
          <v-avatar :color="stat.color + '15'" size="45">
            <v-icon :color="stat.color">{{ stat.icon }}</v-icon>
          </v-avatar>
          <div class="text-right">
            <div class="text-h5 font-weight-bold" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div class="grey--text text-caption font-weight-bold">{{ stat.label }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-chip v-else small class="status-chip font-weight-bold px-3" :color="statusConfig.bg"
      :text-color="statusConfig.text" style="border-radius: 6px; border: 1px solid transparent;"
      :style="{ borderColor: statusConfig.border }">
      <v-icon left x-small class="mr-1" :color="statusConfig.text">
        mdi-circle
      </v-icon>
      <span class="text-caption" style="font-size: 13px !important; letter-spacing: 0.5px; font-weight: 500;">
        {{ statusConfig.label }}
      </span>
    </v-chip>
  </div>
</template>

<script>
export default {
  name: "StatsGrid",
  props: {
    value: { type: [Number, String], default: null },
    stats: { type: Array, default: null },
    activeId: { type: [String, Number], default: 'all' }
  },
  computed: {
    statusConfig() {
      const map = {
        0: { label: "inactive", bg: "#9CA3AF", text: "#8B0000", border: "#9CA3AF" },
        1: { label: "Active", bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
      };
      return map[this.value] || { label: "ไม่ระบุ", bg: "#F3F4F6", text: "#9CA3AF", border: "transparent" };
    }
  }
};
</script>

<style scoped>
/* สไตล์สำหรับการ์ดสถิติที่เพิ่มเข้ามา */
.stat-card {
  cursor: pointer;
  border: 1px solid #eef2f6 !important;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
}

.active-stat-card {
  border: 2.5px solid #1E88E5 !important;
  background: #f0f7ff;
}

.status-chip {
  transition: all 0.2s ease-in-out;
}
</style>