<template>
  <div>
    <div v-if="$vuetify.breakpoint.xsOnly">
      <div class="d-flex overflow-x-auto hide-scrollbar pb-3" style="gap: 12px; padding: 0 4px;">

        <v-card v-for="(stat, index) in stats" :key="index"
          class="flex-shrink-0 rounded-xl d-flex align-center cursor-pointer elevation-2"
          :style="getMobileCardStyle(stat)" @click="handleClick(stat)" v-ripple width="240" height="80">
          <div class="rounded-lg d-flex justify-center align-center ml-3 mr-3 flex-shrink-0"
            :style="`background-color: ${stat.bg}; width: 48px; height: 48px;`">
            <v-icon size="28" :style="`color: ${stat.color};`">{{ stat.icon }}</v-icon>
          </div>

          <div class="flex-grow-1 pr-4 text-right overflow-hidden">
            <div class="text-h5 font-weight-bold mb-0 text-truncate" style="color: #1F2937; line-height: 1.2;">
              {{ stat.count }}
            </div>
            <div class="caption font-weight-bold grey--text text--darken-1 text-truncate">
              {{ stat.label }}
            </div>
          </div>
        </v-card>

        <div style="min-width: 1px;"></div>
      </div>
    </div>

    <v-row v-else class="mb-6">
      <v-col cols="12" sm="6" md="3" v-for="(stat, index) in stats" :key="index">
        <v-hover v-slot="{ hover }">
          <v-card class="px-4 py-5 rounded-xl d-flex align-center cursor-pointer transition-swing"
            :elevation="hover ? 3 : 0" :style="getCardStyle(stat)" @click="handleClick(stat)" v-ripple min-height="104">
            <div class="rounded-lg d-flex justify-center align-center mr-4 flex-shrink-0"
              :style="`background-color: ${stat.bg}; width: 64px; height: 64px;`">
              <v-icon size="36" :style="`color: ${stat.color};`">{{ stat.icon }}</v-icon>
            </div>

            <div class="flex-grow-1 text-right">
              <div class="text-h4 font-weight-bold mb-1" style="color: #1F2937; line-height: 1;">
                {{ stat.count }}
              </div>
              <div class="text-caption font-weight-bold grey--text text--darken-1"
                style="font-size: 0.85rem !important;">
                {{ stat.label }}
              </div>
            </div>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'StatsGrid',
  props: {
    stats: { type: Array, default: () => [] },
    currentFilter: { type: String, default: 'all' },
    activeId: { type: [String, Number], default: null }
  },
  methods: {
    handleClick(stat) {
      if (stat.filterKey) {
        this.$emit('update:filter', stat.filterKey)
      } else if (stat.id) {
        this.$emit('click-stat', stat)
      }
    },
    getCardStyle(stat) {
      const isActive = (this.currentFilter === stat.filterKey) || (this.activeId === stat.id);
      if (isActive) {
        return `background-color: ${stat.bg}; border: 2px solid ${stat.color};`;
      }
      return `background-color: white; border: 1px solid #E5E7EB;`;
    },
    getMobileCardStyle(stat) {
      const isActive = (this.currentFilter === stat.filterKey) || (this.activeId === stat.id);
      if (isActive) {
        return `background-color: ${stat.bg}; border: 1.5px solid ${stat.color};`;
      }
      return `background-color: white; border: 1px solid #E5E7EB;`;
    }
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

/* ซ่อน Scrollbar แต่ยังเลื่อนได้ */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* ใช้ overflow-x ธรรมดา ไม่ต้องมี snap */
.overflow-x-auto {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  /* ให้เลื่อนลื่นบน iOS */
}
</style>