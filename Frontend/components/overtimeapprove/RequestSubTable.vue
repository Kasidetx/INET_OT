<template>
  <div class="pa-0" style="border-top: 1px solid #eee;">
    <v-data-table
      :headers="headers"
      :items="items"
      hide-default-footer
      class="elevation-0 transparent-table"
    >
      <template v-slot:item.detail="{ item }">
        <div class="py-3">
          <div class="font-weight-bold text-body-2 mb-1">{{ item.detailTitle }}</div>
          <div class="grey--text caption">{{ item.detailDesc }}</div>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
         <Status :value="item.status" />
      </template>

      <template v-slot:item.action>
        <v-btn icon small outlined color="grey lighten-1" style="border-color: #E0E0E0;">
          <v-icon color="primary" small>mdi-eye-outline</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// Import Component ที่เราสร้างในข้อ 1
import Status from "@/components/global/Status.vue"; 

export default {
  name: 'RequestSubTable',
  props: {
    items: Array
  },
  components: {
    Status,
  },
  data() {
    return {
      headers: [
        { text: 'ลำดับ', value: 'id', align: 'center', sortable: false, class: 'caption' },
        { text: 'หมายเลขคำร้อง', value: 'reqNo', sortable: false, class: 'caption' },
        { text: 'รายละเอียด', value: 'detail', sortable: false, class: 'caption' },
        { text: 'จำนวนชั่วโมง', value: 'hours', align: 'center', sortable: false, class: 'caption' },
        { text: 'วัน-เวลาที่เริ่ม', value: 'start', sortable: false, class: 'caption' },
        { text: 'วัน-เวลาที่สิ้นสุด', value: 'end', sortable: false, class: 'caption' },
        { text: 'วันที่ทำรายการ', value: 'transDate', sortable: false, class: 'caption' },
        { text: 'สถานะ', value: 'status', align: 'center', sortable: false, class: 'caption' },
        { text: '', value: 'action', align: 'center', sortable: false },
      ]
    }
  },
}
</script>

<style scoped>
.transparent-table {
  background-color: transparent !important;
}
</style>