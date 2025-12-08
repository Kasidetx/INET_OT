<template>
  <v-col class="pa-0">
    <!-- Filters -->
    <v-row class="pa-4" align="center">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          placeholder="ค้นหาระดับ"
          append-icon="mdi-magnify"
          outlined
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="4">
        <v-row no-gutters align="baseline">
          <span class="mr-2">สถานะ :</span>
          <v-select
            v-model="selectedStatus"
            :items="statuses"
            placeholder="สถานะ"
            append-icon="mdi-chevron-down"
            outlined
            dense
            hide-details
          />
        </v-row>
      </v-col>

      <v-col cols="12" md="2">
        <v-btn block style="color: #0863B6 !important; background-color: #E5EFFF !important;" rounded @click="fetchLevels">
          ค้นหา
        </v-btn>
      </v-col>
    </v-row>

    <!-- Title -->
    <v-row no-gutters justify="space-between" align="baseline">
      <div class="pl-4" style="font-size: 1.1rem; font-weight: 600;">
        รายการระดับตำแหน่ง
      </div>
      <div>
        <v-col cols="12" md="2" class="text-right">
          <v-btn color="#0863B6" class="white--text" rounded @click="dialog = true">
            <v-icon left>
              bi-plus-circle
            </v-icon> เพิ่มระดับ
          </v-btn>
        </v-col>
      </div>
    </v-row>

    <!-- Table -->
    <v-col>
      <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page.sync="rowsPerPage"
        :page.sync="page"
        :server-items-length="totalItems"
        :loading="loading"
        class="elevation-1"
        @update:page="fetchLevels"
        @update:items-per-page="onChangeRowsPerPage"
      >
        <!-- สถานะ -->
        <template #[`item.status`]="{ item }">
          <v-chip :color="getStatusColor(item.status)" :text-color="getTextColor(item.status)">
            {{ item.status }}
          </v-chip>
        </template>

        <!-- ปุ่มจัดการ -->
        <template #[`item.actions`]="{ item }">
          <v-row no-gutters style="gap: 12px;" justify="center">
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <v-btn
                  small
                  outlined
                  color="#6AA1D3"
                  v-bind="attrs"
                  v-on="on"
                  @click="editItem(item)"
                >
                  <v-icon size="18">
                    bi-pencil-fill
                  </v-icon>
                </v-btn>
              </template>
              <span>แก้ไข</span>
            </v-tooltip>

            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <v-btn
                  small
                  outlined
                  color="#6AA1D3"
                  v-bind="attrs"
                  v-on="on"
                  @click="deleteItem(item)"
                >
                  <v-icon size="18">
                    bi-trash-fill
                  </v-icon>
                </v-btn>
              </template>
              <span>ลบ</span>
            </v-tooltip>
          </v-row>
        </template>
      </v-data-table>
    </v-col>
    <DialogAddPositionLevel v-model="dialog" @refresh="fetchLevels" />
    <DialogEditPositionLevel v-model="dialogEdit" :item="selectedItem" @refresh="fetchLevels" />
  </v-col>
</template>

<script>
import DialogAddPositionLevel from '@/components/position/DialogAddPositionLevel.vue'
import DialogEditPositionLevel from '@/components/position/DialogEditPositionLevel.vue'
import deleteImg from '@/assets/img/Delete.png'
export default {
  name: 'SecPositionLevel',
  components: {
    DialogAddPositionLevel,
    DialogEditPositionLevel
  },
  data () {
    return {
      dialog: false,
      dialogEdit: false,
      selectedItem: null,
      search: '',
      selectedStatus: 'ทั้งหมด',
      statuses: ['ทั้งหมด', 'ใช้งาน', 'ไม่ใช้งาน'],
      page: 1,
      rowsPerPage: 10,
      totalItems: 0,
      loading: false,
      filteredItems: [],
      headers: [
        { text: 'ลำดับ', value: 'index', width: '8%', align: 'center', sortable: false },
        { text: 'ชื่อระดับ (ไทย)', value: 'name_th', width: '15%', align: 'center', sortable: false },
        { text: 'ชื่อระดับ (อังกฤษ)', value: 'name_en', width: '15%', align: 'center', sortable: false },
        { text: 'คำอธิบาย', value: 'description', align: 'center', sortable: false },
        { text: 'สถานะ', value: 'status', width: '10%', align: 'center', sortable: false },
        { text: 'จัดการ', value: 'actions', sortable: false, align: 'center' }
      ],
      items: []
    }
  },
  created () {
    this.fetchLevels()
  },
  methods: {
    async deleteItem (item) {
      const confirm = await this.$swal({
        title: '<div style="font-size: 1.3rem; font-weight: bold; color: #0863B6; padding: 0;">ลบระดับตำเเหน่ง</div>',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการลบระดับตำแหน่งรายการนี้?',
        html: `
          <img src="${deleteImg}" style="width: 200px; height: 176px; margin-bottom: 1rem;" />
          <div style="font-weight: bold; color: #0863B6; font-size: 1.1rem;">ต้องการลบระดับตำเเหน่งใช่หรือไม่</div>
          <div style="margin-top: 8px; color: #989898; font-size: 1.1rem;">คุณแน่ใจหรือไม่ว่าต้องการลบระดับตำแหน่งรายการนี้</div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        showCloseButton: true,
        reverseButtons: true,
        customClass: {
          confirmButton: 'custom-swal-confirm',
          cancelButton: 'custom-swal-cancel'
        }
      })

      if (!confirm.isConfirmed) { return }

      try {
        const payload = {
          level_id: item.level_id
        }

        const res = await this.$axios.post(process.env.API_DELETE_LEVEL_POSITION, payload)

        // ตรวจสอบว่า response สำเร็จ
        if (res && res.data && res.data.status === 'success') {
          this.$swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ระดับตำแหน่งถูกลบเรียบร้อยแล้ว',
            timer: 2000,
            showConfirmButton: false
          })
          this.fetchLevels()
        } else {
          // response ได้ 200 แต่ status !== success
          throw new Error(res.data.message || 'ลบไม่สำเร็จ')
        }
      } catch (error) {
        console.error('🔥 ลบระดับล้มเหลว:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบระดับได้ กรุณาลองใหม่อีกครั้ง',
          timer: 2000,
          showConfirmButton: false
        })
      }
    },

    async fetchLevels () {
      this.loading = true
      try {
        let statusValue = ''
        if (this.selectedStatus === 'ใช้งาน') {
          statusValue = '1'
        } else if (this.selectedStatus === 'ไม่ใช้งาน') {
          statusValue = '0'
        }
        const payload = {
          search: this.search.trim(),
          is_active: statusValue,
          limit: this.rowsPerPage,
          page: this.page
        }
        const response = await this.$axios.post(process.env.API_GETALL_LEVEL_POSITION, payload)
        console.log('📦 Data from API:', response.data.result.data)

        if (response.data.status === 'success') {
          const result = response.data.result?.data || []
          this.totalItems = response.data.result.total
          this.items = result.map((item, index) => ({
            index: (this.page - 1) * this.rowsPerPage + index + 1,
            name_th: item.name_th,
            name_en: item.name_eng,
            description: item.description,
            status: item.is_active === 1 ? 'ใช้งาน' : 'ไม่ใช้งาน',
            level_id: item.level_id
          }))

          this.filteredItems = this.items
        } else {
          console.error('❌ โหลดข้อมูลไม่สำเร็จ:', response.data.message)
        }
      } catch (error) {
        console.error('🔥 Error in fetchLevels:', error)
      }
      this.loading = false
    },
    onChangeRowsPerPage (val) {
      this.rowsPerPage = val
      this.page = 1
      this.fetchLevels()
    },
    getStatusColor (status) {
      return status === 'ใช้งาน' ? '#EEF9E8' : '#F9FAFB'
    },
    getTextColor (status) {
      return status === 'ใช้งาน' ? '#52C41A' : '#333'
    },
    searchItems () {
      this.filteredItems = this.items.filter((item) => {
        const matchSearch =
          this.search === '' ||
          item.name_th.includes(this.search) ||
          item.name_en.toLowerCase().includes(this.search.toLowerCase())

        const matchStatus =
          this.selectedStatus === 'ทั้งหมด' || item.status === this.selectedStatus

        return matchSearch && matchStatus
      })
    },
    editItem (item) {
      this.selectedItem = item
      this.dialogEdit = true
    }
  }
}
</script>

<style scoped>
.v-btn:not(.v-btn--round).v-size--default {
    height: 40px;
}
::v-deep .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
    color: rgba(0, 0, 0, 0.6);
    background-color: #F9FAFB;
}
::v-deep .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr:last-child > th {
    border-bottom: none;
}
</style>
