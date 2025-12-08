<template>
  <v-container>
    <v-row class="ml-1 mb-1">
      <v-col cols="auto">
        <p class="text-head">จัดการตำแหน่ง</p>
      </v-col>
    </v-row>
    <v-card class="card-company pa-5" flat>
      <v-tabs v-model="tab" background-color="white">
        <v-tab>ตำแหน่ง</v-tab>
        <v-tab>ระดับตำแหน่ง</v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <!-- Tab 0 -->
        <v-tab-item>
          <SecPosition />
        </v-tab-item>

        <!-- Tab 1 -->
        <v-tab-item>
          <SecPositionLevel />
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-container>
</template>

<script>
import SecPosition from '@/components/position/SecPosition.vue'
import SecPositionLevel from '@/components/position/SecPositionLevel.vue'
export default {
  name: 'Position',
  components: {
    SecPosition,
    SecPositionLevel
  },
  data () {
    return {
      tab: 0
    }
  }
}
</script>

<style scoped>
.v-sheet.v-card:not(.v-sheet--outlined) {
    box-shadow: none;
}
.text-head {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
}
.card-company {
  border-radius: 24px;
  padding: auto;
}
</style>
