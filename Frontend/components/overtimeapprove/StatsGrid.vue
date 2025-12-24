<template>
  <v-row class="mb-6">
    <v-col cols="12" md="3" sm="6" v-for="(stat, index) in stats" :key="index">
      <v-hover v-slot="{ hover }">
        <v-card 
          class="pa-5 rounded-xl d-flex align-center transition-swing"
          :elevation="hover ? 4 : 0"
          style="border: 1px solid #E0E0E0; height: 100%; background: white;"
        >
          <div 
            class="rounded-lg d-flex justify-center align-center mr-5 elevation-0"
            :style="`background-color: ${stat.bg}; width: 64px; height: 64px; min-width: 64px; border: 1px solid ${stat.borderColor}`"
          >
            <v-icon size="30" :color="stat.iconColor">{{ stat.icon }}</v-icon>
          </div>
          
          <div class="flex-grow-1">
            <div class="text-h4 font-weight-bold mb-0" style="color: #2D3748; line-height: 1.2;">
              {{ stat.count }}
            </div>
            <div class="text-caption font-weight-medium grey--text text--darken-1 mt-1">
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
    stats: {
      type: Array,
      default: () => []
    }
  }
}
</script>