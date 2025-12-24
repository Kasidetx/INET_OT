<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h3 class="text-h6 font-weight-bold primary--text">
        รายการเอกสารทั้งหมด <span class="black--text">{{ items.length }}</span> รายการ
      </h3>
    </div>

    <v-data-table
      :headers="headers"
      :items="items"
      :expanded.sync="expanded"
      show-expand
      item-key="id"
      class="elevation-0 rounded-0 custom-table"
      hide-default-footer
      :loading="loading"
    >
      <template v-slot:item.data-table-expand="{ expand, isExpanded }">
          <v-btn icon small @click="expand(!isExpanded)">
            <v-icon :color="isExpanded ? 'primary' : 'grey'">
              {{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </v-btn>
      </template>

      <template v-slot:item.totalHours="{ item }">
        <span class="font-weight-bold grey--text text--darken-3">{{ item.totalHours }}</span>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="pa-0 white">
          <RequestSubTable :items="item.requests" />
        </td>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// ✅ Import จากโฟลเดอร์เดียวกัน
import RequestSubTable from './RequestSubTable.vue';

export default {
  name: 'EmployeeTable',
  components: { RequestSubTable },
  props: {
    items: Array,
    loading: Boolean
  },
  data() {
    return {
      expanded: [],
      headers: [
        { text: 'ลำดับ', value: 'rank', align: 'center', sortable: false, width: '50px' },
        { text: 'รหัสพนักงาน', value: 'empCode', sortable: false, class: 'grey--text text--darken-2' },
        { text: 'ชื่อ-นามสกุล', value: 'name', sortable: false, class: 'font-weight-bold' },
        { text: 'ตำแหน่ง', value: 'position', sortable: false },
        { text: 'แผนก', value: 'department', sortable: false },
        { text: 'บริษัท', value: 'company', sortable: false },
        { text: 'จำนวนรายการ', value: 'itemsCount', align: 'center', sortable: false },
        { text: 'รวมชั่วโมง', value: 'totalHours', align: 'center', sortable: false },
        { text: '', value: 'data-table-expand', align: 'end' },
      ],
    }
  }
}
</script>

<style>
.custom-table.v-data-table {
  border: 1px solid #E0E0E0;
}
.custom-table .v-data-table-header th {
  background-color: #EEEEEE !important;
  color: #424242 !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
}
.custom-table tbody tr:hover:not(.v-data-table__expanded__content) {
  background-color: #F0F7FF !important;
}
</style>