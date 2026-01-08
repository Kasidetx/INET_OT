<template>
  <v-container fluid class="ot-page px-10 py-6">
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10">
        <template>
          <div class="page-title">
            ประเภทการจ่ายค่าล่วงเวลา
          </div>
        </template>


        <!-- การ์ดหลักแบบ iRecruit -->
        <OvertimeTypeForm @saved="handleSaved" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import OvertimeTypeForm from '~/components/overtime/overtimetypeform.vue'

export default {
  components: {
    OvertimeTypeForm
  },
  methods: {
    handleSaved(payload) {
      // ไว้ต่อกับ API / Dialog ทีหลัง
      // eslint-disable-next-line no-console
      console.log('saved overtime type', payload)
    }
  }
}
</script>

<style scoped>
.ot-page {
  max-width: auto;
}

.page-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  margin-right: 1000px;
}
</style>
