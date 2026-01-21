<template>
  <v-dialog v-model="show" max-width="900px" persistent
    :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'">
    <v-card class="rounded-xl d-flex flex-column" style="max-height: 100vh;">

      <v-card-title class="blue lighten-5 d-flex justify-center py-4 relative flex-shrink-0">
        <span class="text-h6 font-weight-bold blue--text text--darken-3">
          รายละเอียดเบิกค่าล่วงเวลา
        </span>
        <v-btn icon absolute right top @click="close" class="mt-2 mr-2">
          <v-icon color="grey darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4 pa-md-6 flex-grow-1 overflow-y-auto">

        <div class="subtitle-1 font-weight-bold mb-4 black--text">รายละเอียดเอกสาร</div>

        <div v-if="item" class="info-section mb-6">
          <v-row dense>
            <v-col cols="12" md="6" class="mb-2 mb-md-0">
              <div class="d-flex align-start">
                <span class="grey--text text--darken-2 info-label">หมายเลขเอกสาร</span>
                <span class="mx-2">:</span>
                <span class="font-weight-medium black--text">{{ item.docs_no }}</span>
              </div>
            </v-col>

            <v-col cols="12" md="6" class="mb-2 mb-md-0">
              <div class="d-flex align-start">
                <span class="grey--text text--darken-2 info-label">จำนวนชั่วโมงรวม</span>
                <span class="mx-2">:</span>
                <span class="font-weight-medium black--text">{{ item.hours }}</span>
              </div>
            </v-col>

            <v-col cols="12" class="mt-2">
              <div class="d-flex align-start">
                <span class="grey--text text--darken-2 info-label">
                  {{ [4, 5, 6].includes(item.status) ? 'เหตุผล' : 'รายละเอียด' }}
                </span>
                <span class="mx-2">:</span>
                <span class="black--text" style="word-break: break-word;">
                  <span v-if="[4, 5, 6].includes(item.status)" class="error--text">
                    {{ item.cancellation_reason || '-' }}
                  </span>
                  <span v-else>
                    {{ item.title || '-' }}
                  </span>
                </span>
              </div>
            </v-col>
          </v-row>
        </div>

        <div class="subtitle-1 font-weight-bold mb-3 black--text">รายการเวลาทำงาน</div>

        <v-card outlined elevation="0" class="rounded-lg overflow-hidden border-light">

          <div v-if="loading" class="pa-8 text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2 grey--text caption">กำลังโหลดข้อมูล...</div>
          </div>

          <div v-else-if="details.length === 0" class="pa-8 text-center grey--text">
            ไม่พบข้อมูลรายละเอียด
          </div>

          <template v-else>

            <v-simple-table v-if="!$vuetify.breakpoint.xsOnly">
              <template v-slot:default>
                <thead class="grey lighten-5">
                  <tr>
                    <th class="text-center font-weight-bold black--text subtitle-2 py-3">ลำดับ</th>
                    <th class="text-left font-weight-bold black--text subtitle-2">วันที่</th>
                    <th class="text-left font-weight-bold black--text subtitle-2">เวลา</th>
                    <th class="text-center font-weight-bold black--text subtitle-2">อัตรา (เท่า)</th>
                    <th class="text-center font-weight-bold black--text subtitle-2">จำนวน (ชม.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(detail, i) in details" :key="i">
                    <td class="text-center grey--text">{{ i + 1 }}</td>
                    <td class="grey--text text--darken-3 font-weight-medium">{{ detail.date }}</td>
                    <td class="grey--text text--darken-2">
                      {{ detail.startTime }} - {{ detail.endTime }}
                    </td>
                    <td class="text-center">
                      <v-chip small :color="getRateColor(detail.rate)" dark class="font-weight-bold px-3">
                        {{ detail.rate }}
                      </v-chip>
                    </td>
                    <td class="text-center font-weight-bold">{{ detail.hours }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>

            <div v-else class="pa-3 bg-gray-light">
              <div v-for="(detail, i) in details" :key="i"
                class="mobile-detail-card mb-3 pa-3 rounded-lg white elevation-1">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="font-weight-bold text-body-1 primary--text">
                    {{ detail.date }}
                  </div>
                  <v-chip x-small :color="getRateColor(detail.rate)" dark class="font-weight-bold">
                    {{ detail.rate }} เท่า
                  </v-chip>
                </div>

                <v-divider class="mb-2 border-dashed"></v-divider>

                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center grey--text text--darken-1 caption">
                    <v-icon x-small class="mr-1">mdi-clock-outline</v-icon>
                    {{ detail.startTime }} - {{ detail.endTime }}
                  </div>
                  <div class="font-weight-bold text-body-2">
                    {{ detail.hours }} ชม.
                  </div>
                </div>
              </div>
            </div>

          </template>
        </v-card>

      </v-card-text>

      <v-card-actions class="justify-center py-4 flex-shrink-0" style="border-top: 1px solid #eee;">
        <v-btn color="#0d47a1" dark depressed width="140" height="44"
          class="rounded-lg text-subtitle-1 font-weight-medium" @click="close">
          ปิด
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "DialogRequestDetail",
  props: {
    value: { type: Boolean, default: false },
    item: { type: Object, default: null },     // ข้อมูล Header
    details: { type: Array, default: () => [] }, // ข้อมูลในตาราง
    loading: { type: Boolean, default: false }
  },
  computed: {
    show: {
      get() { return this.value; },
      set(val) { this.$emit("input", val); }
    }
  },
  methods: {
    close() {
      this.show = false;
    },
    getRateColor(rate) {
      const r = parseFloat(rate);
      if (r >= 3.0) return 'red lighten-1';
      if (r >= 1.5) return 'orange lighten-1';
      return 'green lighten-1';
    }
  }
};
</script>

<style scoped>
.info-label {
  min-width: 110px;
  /* จัด Label ให้ตรงกันใน PC */
}

.border-light {
  border: 1px solid #e0e0e0;
}

.bg-gray-light {
  background-color: #F8F9FA;
}

.border-dashed {
  border-style: dashed;
  border-color: #eee;
}

.mobile-detail-card {
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

/* ปรับ Scrollbar ให้สวยงาม */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .info-label {
    min-width: 90px;
    /* ลดความกว้าง Label บนมือถือ */
    font-size: 0.9rem;
  }
}
</style>