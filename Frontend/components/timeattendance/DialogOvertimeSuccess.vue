<template>
  <v-dialog v-model="internalDialog" max-width="520">
    <v-card :style="{ borderRadius: '16px', overflow: 'hidden' }">
      <!-- Header -->
      <v-card-title class="d-flex justify-center align-center" style="position: relative; background-color: #e5efff;">
        <span class="font-weight-bold text-center" style="font-size: 1.2rem; color: #0863b6;">
          คำขอเบิกค่าล่วงเวลา
        </span>

        <v-btn icon @click="close" style="
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            min-width: 32px;
            height: 32px;
          ">
          <v-icon color="#0863B6">
            mdi-close
          </v-icon>
        </v-btn>
      </v-card-title>

      <!-- Body -->
      <v-card-text style="padding: 32px 40px 24px;">
        <div class="d-flex flex-column align-center text-center">
          <!-- วงกลมเขียว + Check -->
          <div>
            <v-icon color="green" style="font-size: 128px;">mdi-check-circle</v-icon>
          </div>

          <!-- ข้อความหลัก -->
          <p style="
              font-size: 20px;
              font-weight: 800;
              color: #0863b6;
              margin-bottom: 8px;
            ">
            คุณได้ทำการส่งคำขอเบิกค่าล่วงเวลาเรียบร้อยแล้ว
          </p>

          <!-- ข้อความรอง -->
          <p style="
              font-size: 14px;
              color: #555555;
              margin: 0;
            ">
            สามารถติดตามสถานะใบคำขอได้ที่รายการคำขอล่วงเวลา
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "DialogOvertimeSuccess",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      internalDialog: this.value,
    };
  },
  watch: {
    value(val) {
      this.internalDialog = val;
    },
    internalDialog(val) {
      this.$emit("input", val); // รองรับ v-model
    },
  },
  methods: {
    close() {
      this.internalDialog = false;
    },
  },
};
</script>
