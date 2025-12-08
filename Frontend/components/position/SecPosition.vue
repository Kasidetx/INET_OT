<template>
  <v-col class="pa-0">
    <!-- Filters -->
    <v-row class="pa-4" align="end">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          placeholder="ค้นหาตำแหน่ง"
          append-icon="mdi-magnify"
          outlined
          dense
          hide-details
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-row no-gutters align="baseline">
          <span class="mr-2">
            ระดับ :
          </span>
          <v-select
            v-model="selectedLevel"
            :items="levels"
            placeholder="ระดับ"
            outlined
            append-icon="mdi-chevron-down"
            dense
            hide-details
          />
        </v-row>
      </v-col>

      <v-col cols="12" md="3">
        <v-row no-gutters align="baseline">
          <span class="mr-2">
            สถานะ :
          </span>
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
        <v-btn block style="color: #0863B6 !important; background-color: #E5EFFF !important;" class="" rounded @click="getAllPositions">
          ค้นหา
        </v-btn>
      </v-col>
    </v-row>
    <v-row no-gutters justify="space-between">
      <div>
        <v-col class="" align-self="center" style="font-size: 1.1rem; font-weight: 600;">
          รายการตำเเหน่ง
        </v-col>
      </div>
      <div>
        <v-col cols="12" md="3" class="">
          <v-btn style="background-color: #0863B6 !important; color: white !important;" rounded @click="addPosition">
            <v-icon left>
              mdi-plus-circle-outline
            </v-icon> เพิ่มตำแหน่ง
          </v-btn>
        </v-col>
      </div>
    </v-row>

    <!-- Table -->
    <v-col>
      <v-data-table
        :headers="headers"
        :items="items"
        :page.sync="page"
        :items-per-page.sync="rowsPerPage"
        :server-items-length="totalItems"
        :loading="loading"
        class="elevation-1"
        @update:page="getAllPositions"
        @update:items-per-page="onChangeRowsPerPage"
      >
        <template #[`item.status`]="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            :text-color="getTextColor(item.status)"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-row no-gutters style="gap: 12px;" justify="center">
            <!-- ปุ่มแก้ไข -->
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
                  <v-icon size="18" class="mr-1">
                    bi-pencil-fill
                  </v-icon>
                </v-btn>
              </template>
              <span>แก้ไข</span>
            </v-tooltip>

            <!-- ปุ่มลบ -->
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
                  <v-icon size="18" class="mr-1">
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
    <DialogAddPosition v-model="dialog" @refresh="getAllPositions" />
    <DialogEditPosition v-model="dialogEdit" :item="selectedItem" @refresh="getAllPositions" />
  </v-col>
</template>

<script>
import DialogAddPosition from '@/components/position/DialogAddPosition.vue'
import DialogEditPosition from '@/components/position/DialogEditPosition.vue'
import deleteImg from '@/assets/img/Delete.png'
export default {
  name: 'SecPosition',
  components: {
    DialogAddPosition,
    DialogEditPosition
  },
  data () {
    return {
      dialog: false,
      dialogEdit: false,
      selectedItem: null,
      search: '',
      selectedLevel: 'ทั้งหมด',
      selectedStatus: 'ทั้งหมด',
      levels: ['ทั้งหมด'],
      statuses: ['ทั้งหมด', 'ใช้งาน', 'ไม่ใช้งาน'],
      page: 1,
      rowsPerPage: 10,
      totalItems: 0,
      loading: false,
      filteredItems: [],
      headers: [
        { text: 'ลำดับ', value: 'index', width: '10%', align: 'center', sortable: false },
        { text: 'ตำแหน่ง (ไทย)', value: 'name_th', width: '20%', align: 'center', sortable: false },
        { text: 'ตำแหน่ง (อังกฤษ)', value: 'name_en', width: '20%', align: 'center', sortable: false },
        { text: 'ระดับตำแหน่ง', value: 'level', width: '20%', align: 'center', sortable: false },
        { text: 'สถานะ', value: 'status', width: '10%', align: 'center', sortable: false },
        { text: 'จัดการ', value: 'actions', sortable: false, width: '20%', align: 'center' }
      ],
      items: [
        { index: 1, name_th: 'กรรมการผู้จัดการ', name_en: 'Managing Director', level: 'CEO', status: 'ใช้งาน' },
        { index: 2, name_th: 'เจ้าหน้าที่ประสานงาน', name_en: 'Coordinator', level: 'O1', status: 'ไม่ใช้งาน' }
      ]
    }
  },
  computed: {
    pageCount () {
      return Math.ceil(this.filteredItems.length / this.rowsPerPage)
    }
  },
  created () {
    this.fetchLevels()
      .then(() => {
        // จากนั้นค่อยโหลดตำแหน่ง
        this.getAllPositions()
      })
  },
  methods: {
    async fetchLevels () {
      try {
        const response = await this.$axios.post(process.env.API_GET_LEVEL_POSITION, {
          search: this.search,
          limit: this.rowsPerPage,
          page: this.page
        })

        if (response.data.status === 'success') {
          console.log('ระดับตำแหน่ง:', response.data.result)

          // เปลี่ยนบรรทัดนี้
          const arr = response.data.result || []
          this.levels = ['ทั้งหมด', ...arr.map(i => i.name_th)]
        } else {
          console.error('Error fetching levels:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching levels:', error)
      }
    },

    onChangeRowsPerPage (val) {
      this.rowsPerPage = val
      this.page = 1
      this.getAllPositions()
    },
    async getAllPositions () {
      this.loading = true
      try {
        let statusValue = ''
        if (this.selectedStatus === 'ใช้งาน') {
          statusValue = '1'
        } else if (this.selectedStatus === 'ไม่ใช้งาน') {
          statusValue = '0'
        }
        const levelValue = this.selectedLevel === 'ทั้งหมด'
          ? ''
          : this.selectedLevel
        const payload = {
          search: this.search.trim(),
          levelname: levelValue,
          is_active: statusValue,
          limit: this.rowsPerPage,
          page: this.page
        }

        const response = await this.$axios.post(process.env.API_GETALL_POSITION, payload)
        console.log('กำลังโหลดตำแหน่ง', response.data.result.data)

        if (response.data.status === 'success') {
          const result = response.data.result?.data || []
          this.items = result.map((item, index) => ({
            index: (this.page - 1) * this.rowsPerPage + index + 1,
            name_th: item.name_th,
            name_en: item.name_eng,
            description: item.description,
            level: item.levelname || 'ไม่ทราบระดับ',
            status: item.is_active === 1 ? 'ใช้งาน' : 'ไม่ใช้งาน',
            position_id: item.position_id
          }))
          this.totalItems = response.data.result.total
          console.log('รายการตำแหน่ง:', this.items)

          this.filteredItems = this.items
        } else {
          console.error('โหลดข้อมูลตำแหน่งไม่สำเร็จ:', response.data.message)
        }
      } catch (err) {
        console.error('API Error:', err)
      }
      this.loading = false
    },
    async deleteItem (item) {
      const confirm = await this.$swal({
        title: '<div style="font-size: 1.3rem; font-weight: bold; color: #0863B6; padding: 0;">ลบตำเเหน่ง</div>',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งรายการนี้?',
        html: `
          <img src="${deleteImg}" style="width: 200px; height: 176px; margin-bottom: 1rem;" />
          <div style="font-weight: bold; color: #0863B6; font-size: 1.1rem;">ต้องการลบตำเเหน่งใช่หรือไม่</div>
          <div style="margin-top: 8px; color: #989898; font-size: 1.1rem;">คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งรายการนี้</div>
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
        const payload = { position_id: item.position_id }
        const response = await this.$axios.post(process.env.API_DELETE_POSITION, payload)
        console.log('กำลังลบ', payload)
        if (response.data.status === 'success') {
          this.$swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ตำแหน่งถูกลบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
          })
          this.getAllPositions() // โหลดรายการใหม่
        } else {
          throw new Error(response.data.message || 'ลบไม่สำเร็จ')
        }
      } catch (error) {
        console.error('ลบตำแหน่งไม่สำเร็จ:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบตำแหน่งได้ กรุณาลองใหม่อีกครั้ง'
        })
      }
    },

    getStatusColor (status) {
      const mappedStatus = this.mapStatus(status)
      switch (mappedStatus) {
        case 'used':
          return '#EEF9E8'
        case 'notUsed':
          return '#F9FAFB'
        default:
          return '#ededed'
      }
    },
    getTextColor (status) {
      const mappedStatus = this.mapStatus(status)
      switch (mappedStatus) {
        case 'used':
          return '#52C41A'
        case 'notUsed':
          return '#333333'
        default:
          return '#c1c1c1'
      }
    },
    mapStatus (text) {
      switch (text) {
        case 'ใช้งาน':
          return 'used'
        case 'ไม่ใช้งาน':
          return 'notUsed'
        default:
          return 'other'
      }
    },
    searchItems () {
      this.filteredItems = this.items.filter((item) => {
        const matchSearch =
          this.search === '' ||
          item.name_th.includes(this.search) ||
          item.name_en.toLowerCase().includes(this.search.toLowerCase())

        const matchLevel =
          this.selectedLevel === 'ทั้งหมด' || item.level === this.selectedLevel

        const matchStatus =
          this.selectedStatus === 'ทั้งหมด' || item.status === this.selectedStatus

        return matchSearch && matchLevel && matchStatus
      })

      this.page = 1 // รีเซ็ตหน้า
    },
    addPosition () {
      this.dialog = true
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
    min-width: 64px;
    padding: 0 16px;
}
::v-deep .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
    color: rgba(0, 0, 0, 0.6);
    background-color: #F9FAFB;
}
::v-deep .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr:last-child > th {
    border-bottom: none;
}

</style>
