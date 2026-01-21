<template>
  <v-app style="background-color: #F8F9FA; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">

      <!-- Stats -->
      <StatsGrid :stats="otStats" :active-id="selectedTypeId" class="mb-6" @click-stat="handleStatClick" />

      <!-- Filter Toolbar -->
      <v-card flat class="rounded-xl pa-2 mb-6 white" style="border: 1px solid #EAEAEA;">
        <v-row align="center" no-gutters class="pa-2">
          <v-col cols="12" md="4" class="pr-md-4 mb-2 mb-md-0">
            <v-text-field v-model="search" dense outlined flat hide-details placeholder="ค้นหาชื่อการตั้งค่า..."
              prepend-inner-icon="mdi-magnify" class="rounded-lg custom-text-field" background-color="#F7F9FC" />
          </v-col>
          <v-col cols="auto">
            <v-btn depressed color="#E3F2FD" class="rounded-lg px-4 primary--text font-weight-bold" height="40">
              <v-icon left size="20">mdi-filter-variant</v-icon> ตัวกรอง
            </v-btn>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn color="#2563eb" dark class="rounded-lg px-6 text-none font-weight-bold" depressed
              @click="openAddDialog" height="40">
              <v-icon left>mdi-plus-circle</v-icon>
              เพิ่มประเภทการจ้าง
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- Content Area -->
      <v-container fluid class="white-area mt-4 pa-0 rounded-xl overflow-hidden">
        <div class="px-4 py-4 border-bottom d-flex align-center">
          <v-icon color="blue" class="mr-2">mdi-format-list-bulleted</v-icon>
          <span class="blue--text subtitle-1 font-weight-bold">รายการตั้งค่า ({{ filteredConfigs.length }})</span>

          <v-chip v-if="selectedTypeId && selectedTypeId !== 'all'" close @click:close="selectedTypeId = 'all'"
            class="ml-3" small color="blue lighten-5" text-color="blue">
            <span class="d-none d-sm-inline mr-1">กรอง:</span>
            <strong>{{ getStatLabel(selectedTypeId) }}</strong>
          </v-chip>
        </div>

        <div class="pa-4">
          <OvertimeSetting :items="filteredConfigs" :loading="loading" @edit="handleEdit" @refresh="fetchData" />
        </div>
      </v-container>

      <v-dialog v-model="dialogVisible" max-width="650px" persistent
        :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'">
        <OvertimeTypeForm ref="otForm" :edit-data="selectedItem" @close="dialogVisible = false" @saved="onFormSaved" />
      </v-dialog>

    </v-main>
  </v-app>
</template>

<script>
import OvertimeTypeForm from '~/components/overtimeconfig/OvertimeTypeForm.vue'
import OvertimeSetting from '~/components/overtimeconfig/OvertimeSetting.vue'
import StatsGrid from '@/components/global/StatsGrid.vue'
import api from "~/service/api"

export default {
  name: 'OvertimeTypePage',
  components: { OvertimeTypeForm, StatsGrid, OvertimeSetting },
  data() {
    return {
      search: '',
      loading: false,
      dialogVisible: false,
      selectedItem: null,
      selectedTypeId: 'all',
      otConfigs: [],
      otStats: [
        { label: 'ทั้งหมด', count: 0, icon: 'mdi-file-document-outline', color: '#1976D2', bg: '#E3F2FD', id: 'all' },
        { label: 'พนักงานปกติ', count: 0, icon: 'mdi-account-outline', color: '#FFA000', bg: '#FFF8E1', id: 1 },
        { label: 'กะปกติ', count: 0, icon: 'mdi-clock-time-four-outline', color: '#6366f1', bg: '#EEF2FF', id: 2 },
        { label: 'กะ 12ชม', count: 0, icon: 'mdi-hours-12', color: '#4CAF50', bg: '#E8F5E9', id: 3 },
        { label: 'รายชั่วโมง', count: 0, icon: 'mdi-account-clock-outline', color: '#EF5350', bg: '#FFEBEE', id: 4 },
        { label: 'ไม่ใช้งาน', count: 0, icon: 'mdi-account-off-outline', color: '#78909C', bg: '#ECEFF1', id: 'inactive' },
      ],
    }
  },
  computed: {
    filteredConfigs() {
      let data = this.otConfigs;
      if (this.selectedTypeId === 'inactive') {
        data = data.filter(i => !i.is_active);
      } else if (this.selectedTypeId && this.selectedTypeId !== 'all') {
        data = data.filter(i => i.employee_type_id === this.selectedTypeId);
      }
      if (this.search) {
        const s = this.search.toLowerCase();
        data = data.filter(i => i.description?.toLowerCase().includes(s) || i.name?.toLowerCase().includes(s));
      }
      return data;
    }
  },
  mounted() { this.fetchData(); },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const response = await api.get('/api/otconfig');
        this.otConfigs = response.result || response.data?.result || [];
        this.updateStats();
      } finally { this.loading = false; }
    },
    handleStatClick(stat) { this.selectedTypeId = stat.id; },
    openAddDialog() {
      this.selectedItem = null;
      this.dialogVisible = true;
    },
    handleEdit(item) {
      this.selectedItem = item;
      this.dialogVisible = true;
    },
    onFormSaved() {
      this.dialogVisible = false;
      this.fetchData();
    },
    updateStats() {
      this.otStats[0].count = this.otConfigs.length;
      this.otStats.slice(1, 5).forEach(stat => {
        stat.count = this.otConfigs.filter(i => i.employee_type_id === stat.id).length;
      });
      this.otStats[5].count = this.otConfigs.filter(i => !i.is_active).length;
    },
    getStatLabel(id) {
      return this.otStats.find(s => s.id === id)?.label || '';
    }
  }
}
</script>

<style scoped>
.white-area {
  background-color: #ffffff;
  border: 1px solid #eaeaea;
}

.custom-text-field>>>.v-input__slot {
  background-color: #F7F9FC !important;
}

.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}
</style>