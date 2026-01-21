<template>
  <v-container fluid class="ot-page px-4 px-md-10 py-6 grey lighten-5">
    <v-row justify="center">
      <v-col cols="12" md="11" lg="11">
        <StatsGrid :stats="otStats" :active-id="selectedTypeId" class="mb-6" @click-stat="handleStatClick" />

        <div class="d-flex flex-wrap align-center gap-3 mb-4">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="ค้นหาชื่อการตั้งค่า..." outlined
            dense hide-details class="white rounded-lg search-field"></v-text-field>

          <v-btn color="white" elevation="0" class="blue--text rounded-lg border-btn" height="40">
            <v-icon left size="18">mdi-filter-variant</v-icon>
            <span class="d-none d-sm-inline">ตัวกรอง</span>
          </v-btn>

          <v-spacer class="d-none d-sm-block"></v-spacer>

          <v-btn color="#2563eb" dark class="btn-add-pill px-6 text-none w-full-mobile ml-auto ml-sm-0" depressed
            @click="openAddDialog" height="40">
            <v-icon left>mdi-plus-circle</v-icon>
            เพิ่มประเภทการจ้าง
          </v-btn>
        </div>

        <v-card outlined class="rounded-xl border-light overflow-hidden">
          <v-card-title class="pb-4 blue--text subtitle-1 font-weight-bold px-4 border-bottom">
            <v-icon color="blue" class="mr-2">mdi-format-list-bulleted</v-icon>
            รายการตั้งค่า ({{ filteredConfigs.length }})

            <v-chip v-if="selectedTypeId && selectedTypeId !== 'all'" close @click:close="selectedTypeId = 'all'"
              class="ml-3" small color="blue lighten-5" text-color="blue">
              <span class="d-none d-sm-inline mr-1">กรอง:</span>
              <strong>{{ getStatLabel(selectedTypeId) }}</strong>
            </v-chip>
          </v-card-title>

          <OvertimeSetting :items="filteredConfigs" :loading="loading" @edit="handleEdit" @refresh="fetchData" />
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogVisible" max-width="650px" persistent :fullscreen="$vuetify.breakpoint.xsOnly"
      :transition="$vuetify.breakpoint.xsOnly ? 'dialog-bottom-transition' : 'dialog-transition'">
      <OvertimeTypeForm ref="otForm" :edit-data="selectedItem" @close="dialogVisible = false" @saved="onFormSaved" />
    </v-dialog>
  </v-container>
</template>

<script>
import OvertimeTypeForm from '~/components/overtimeconfig/OvertimeTypeForm.vue'
import OvertimeSetting from '~/components/overtimeconfig/OvertimeSetting.vue'
import StatsGrid from '~/components/overtimeconfig/StatsGrid.vue'
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
        { label: 'ทั้งหมด', value: 0, icon: 'mdi-file-document', color: '#1976D2', id: 'all' },
        { label: 'พนักงานปกติ', value: 0, icon: 'mdi-account', color: '#FFA000', id: 1 },
        { label: 'กะปกติ', value: 0, icon: 'mdi-clock-outline', color: '#6366f1', id: 2 },
        { label: 'กะ 12ชม', value: 0, icon: 'mdi-hours-12', color: '#4CAF50', id: 3 },
        { label: 'รายชั่วโมง', value: 0, icon: 'mdi-account-clock', color: '#EF5350', id: 4 },
        { label: 'ไม่ใช้งาน', value: 0, icon: 'mdi-account-off', color: '#78909C', id: 'inactive' },
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
      this.otStats[0].value = this.otConfigs.length;
      this.otStats.slice(1, 5).forEach(stat => {
        stat.value = this.otConfigs.filter(i => i.employee_type_id === stat.id).length;
      });
      this.otStats[5].value = this.otConfigs.filter(i => !i.is_active).length;
    },
    getStatLabel(id) {
      return this.otStats.find(s => s.id === id)?.label || '';
    }
  }
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}

.search-field {
  min-width: 280px;
}

.border-btn {
  border: 1px solid #e3f2fd !important;
}

.border-light {
  border: 1px solid #eef2f6 !important;
}

.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}

.btn-add-pill {
  border-radius: 50px;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

@media (max-width: 600px) {
  .search-field {
    width: 100%;
    min-width: 100%;
  }

  .w-full-mobile {
    width: 100%;
    margin-top: 8px;
  }
}
</style>