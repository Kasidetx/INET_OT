<template>
  <v-chip
    small
    label
    class="font-weight-bold rounded-lg px-4"
    :color="statusConfig.bg"
    :text-color="statusConfig.text"
    style="min-width: 100px; justify-content: center;"
  >
    <v-icon left small v-if="statusConfig.icon">{{ statusConfig.icon }}</v-icon>
    {{ statusConfig.label }}
  </v-chip>
</template>

<script>
export default {
  name: "StatusBadge",
  props: {
    value: {
      type: [Number, String], // รับค่า ID เช่น 1, 2, 3
      required: true
    }
  },
  computed: {
    statusConfig() {
      // Logic แปลง ID เป็น สี/ข้อความ/ไอคอน
      const map = {
        1: { label: "รออนุมัติ",    bg: "#FFF3E0", text: "#F57C00", icon: "mdi-clock-outline" },
        2: { label: "อนุมัติแล้ว",   bg: "#E8F5E9", text: "#2E7D32", icon: "mdi-check-circle-outline" },
        3: { label: "ไม่อนุมัติ",    bg: "#FFEBEE", text: "#D32F2F", icon: "mdi-close-circle-outline" },
        4: { label: "ยกเลิก",      bg: "#F5F5F5", text: "#616161", icon: "mdi-cancel" }
      };
      
      return map[this.value] || { label: "ไม่ระบุ", bg: "#EEEEEE", text: "#9E9E9E" };
    }
  }
};
</script>