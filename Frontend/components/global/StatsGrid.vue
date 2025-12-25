<template>
  <v-row class="mb-6">
    <v-col 
      cols="12" sm="6" md="3" 
      v-for="(stat, index) in stats" 
      :key="index"
    >
      <v-hover v-slot="{ hover }">
        <v-card 
          class="px-4 py-5 rounded-xl d-flex align-center cursor-pointer transition-swing"
          :elevation="hover ? 3 : 0"
          :style="getCardStyle(stat)"
          @click="$emit('update:filter', stat.filterKey)"
          v-ripple
          min-height="104"
        >
          <div 
            class="rounded-lg d-flex justify-center align-center mr-4 flex-shrink-0"
            :style="`background-color: ${stat.bg}; width: 64px; height: 64px;`"
          >
            <v-icon size="36" :style="`color: ${stat.color};`">{{ stat.icon }}</v-icon>
          </div>
          
          <div class="flex-grow-1 text-right">
            <div class="text-h4 font-weight-bold mb-1" style="color: #1F2937; line-height: 1;">
              {{ stat.count }}
            </div>
            <div class="text-caption font-weight-bold grey--text text--darken-1" style="font-size: 0.85rem !important;">
              {{ stat.label }} 
              </div>
          </div>
        </v-card>
      </v-hover>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'StatsGrid',
  props: {
    stats: { type: Array, default: () => [] },
    currentFilter: { type: String, default: 'all' }
  },
  methods: {
    getCardStyle(stat) {
      const isActive = this.currentFilter === stat.filterKey;
      if (isActive) {
         return `background-color: ${stat.bg}; border: 2px solid ${stat.color};`;
      }
      return `background-color: white; border: 1px solid #E5E7EB;`;
    }
  }
}
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>