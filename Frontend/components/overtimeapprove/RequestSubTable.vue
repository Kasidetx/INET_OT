<template>
  <div class="pa-0" style="border-top: 1px solid #eee;">
    <v-data-table :headers="headers" :items="items" :item-key="itemKey" :show-select="selectable"
      v-model="localSelected" hide-default-footer class="elevation-0 transparent-table" dense>
      <template v-slot:item.detail="{ item }">
        <div class="py-3">
          <div class="font-weight-bold text-body-2 mb-1">{{ item.detailTitle }}</div>
          <div class="grey--text caption">{{ item.detailDesc }}</div>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <Status :value="item.status" />
      </template>

   <template v-slot:item.action="{ item }">
  <v-btn icon small outlined color="grey lighten-1"
    style="border-color:#E0E0E0;"
    @click="$emit('view', item)"
  >
    <v-icon color="primary" small>mdi-eye-outline</v-icon>
  </v-btn>
</template>



    </v-data-table>
  </div>
</template>

<script>
import Status from "@/components/global/Status.vue";

export default {
  name: "RequestSubTable",
  components: { Status },
  props: {
    items: { type: Array, default: () => [] },
    selected: { type: Array, default: () => [] },
    itemKey: { type: String, default: "reqNo" },
    selectable: { type: Boolean, default: false }
  },
  data() {
    return {
      localSelected: [],
      // ❌ ลบ headers ออกจากตรงนี้
    };
  },
  computed: {
    // ✅ [แก้ไข] สร้าง headers ใน computed แทน
    headers() {
      const h = [
        { text: "ลำดับ", value: "id", align: "center", sortable: false, class: "caption", width: "60px" },
        { text: "หมายเลขคำร้อง", value: "reqNo", sortable: false, class: "caption" },
        { text: "รายละเอียด", value: "detail", sortable: false, class: "caption" },
        { text: "จำนวนชั่วโมง", value: "hours", align: "center", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่เริ่ม", value: "start", sortable: false, class: "caption" },
        { text: "วัน-เวลาที่สิ้นสุด", value: "end", sortable: false, class: "caption" },
        { text: "วันที่ทำรายการ", value: "transDate", sortable: false, class: "caption" },
        { text: "สถานะ", value: "status", align: "center", sortable: false, class: "caption" },
        { text: "", value: "action", align: "center", sortable: false }
      ];

      // ใส่ logic: ถ้า selectable = true ให้เพิ่มคอลัมน์ checkbox
      if (this.selectable) {
        h.unshift({ text: "", value: "data-table-select", sortable: false, width: 48 });
      }

      return h;
    }
  },
  watch: {
    selected: {
      immediate: true,
      deep: true,
      handler(val) {
        this.localSelected = Array.isArray(val) ? val : [];
      }
    },
    localSelected: {
      deep: true,
      handler(val) {
        this.$emit("update:selected", val);
      }
    }
  }
};
</script>

<style scoped>
.transparent-table {
  background: transparent !important;
}
</style>