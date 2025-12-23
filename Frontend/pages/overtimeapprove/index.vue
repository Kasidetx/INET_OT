<template>
  <v-app style="background-color: white; font-family: 'Sarabun', sans-serif;">
    <v-main class="pa-6">
      <div class="mb-6">
        <v-tabs background-color="transparent" color="#1E88E5" slider-size="3">
          <v-tab class="font-weight-bold text-body-1 px-0 mr-8" style="letter-spacing: 0;">อนุมัติค่าล่วงเวลา</v-tab>
          <v-tab class="font-weight-medium text-body-1 grey--text px-0" style="letter-spacing: 0;" disabled>อนุมัติค่ารักษา</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>

      <v-row class="mb-6">
        <v-col cols="12" md="3" sm="6" v-for="(stat, index) in stats" :key="index">
          <v-hover v-slot="{ hover }">
            <v-card 
              class="pa-5 rounded-xl d-flex align-center transition-swing"
              :elevation="hover ? 4 : 0"
              style="border: 1px solid #E0E0E0; height: 100%; background: white;"
            >
              <div 
                class="rounded-lg d-flex justify-center align-center mr-5 elevation-0"
                :style="`background-color: ${stat.bg}; width: 64px; height: 64px; min-width: 64px; border: 1px solid ${stat.borderColor}`"
              >
                <v-icon size="30" :color="stat.iconColor">{{ stat.icon }}</v-icon>
              </div>
              
              <div class="flex-grow-1">
                <div class="text-h4 font-weight-bold mb-0" style="color: #2D3748; line-height: 1.2;">
                  {{ stat.count }}
                </div>
                <div class="text-caption font-weight-medium grey--text text--darken-1 mt-1">
                  {{ stat.label }}
                </div>
              </div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

      <v-card flat class="rounded-xl pa-2 mb-6 white" style="border: 1px solid #EAEAEA;">
        <v-row align="center" no-gutters class="pa-2">
          <v-col cols="12" md="4" class="pr-md-4 mb-2 mb-md-0">
            <v-text-field
              dense
              outlined
              flat
              hide-details
              placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
              prepend-inner-icon="mdi-magnify"
              class="rounded-lg custom-text-field"
              background-color="#F7F9FC"
            ></v-text-field>
          </v-col>
          
          <v-col cols="auto">
            <v-btn 
              depressed 
              color="#E3F2FD" 
              class="rounded-lg text-capitalize px-4 primary--text font-weight-bold"
              height="40"
            >
              <v-icon left size="20">mdi-filter-variant</v-icon>
              ตัวกรอง
            </v-btn>
          </v-col>
          
          <v-spacer></v-spacer>
          
          <v-col cols="auto">
            <v-btn 
              outlined 
              color="success" 
              class="rounded-lg font-weight-bold px-4"
              height="40"
              style="border-color: #4CAF50;"
            >
              <v-icon left color="success">mdi-microsoft-excel</v-icon>
              ดาวน์โหลดไฟล์
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <div class="d-flex align-center mb-4">
        <h3 class="text-h6 font-weight-bold primary--text">
          รายการเอกสารทั้งหมด 8 รายการ
        </h3>
      </div>

      <v-data-table
        :headers="headers"
        :items="employees"
        :expanded.sync="expanded"
        show-expand
        item-key="id"
        class="elevation-0 rounded-0 custom-table"  hide-default-footer
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
            <div class="pa-0" style="border-top: 1px solid #eee;">
              <v-data-table
                :headers="subHeaders"
                :items="item.requests"
                hide-default-footer
                class="elevation-0"
              >
                <template v-slot:item.detail="{ item }">
                  <div class="py-3">
                    <div class="font-weight-bold text-body-2 mb-1">{{ item.detail.split('\n')[0] }}</div>
                    <div class="grey--text caption">{{ item.detail.split('\n')[1] }}</div>
                  </div>
                </template>

                <template v-slot:item.status="{ item }">
                  <v-chip
                    small
                    label
                    class="font-weight-bold rounded-lg px-4"
                    :color="getStatusColor(item.status).bg"
                    :text-color="getStatusColor(item.status).text"
                    style="min-width: 100px; justify-content: center;"
                  >
                    <v-icon left small size="16" class="mr-1">{{ getStatusColor(item.status).icon }}</v-icon>
                    {{ item.status }}
                  </v-chip>
                </template>

                <template v-slot:item.action>
                  <v-btn icon small outlined color="grey lighten-1" style="border-color: #E0E0E0;">
                    <v-icon color="primary" small>mdi-eye-outline</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </div>
          </td>
        </template>
      </v-data-table>

      <v-row class="mt-4 align-center justify-end">
        <span class="caption grey--text mr-3">แสดง</span>
        <v-select
          :items="[10, 20, 50]"
          value="10"
          dense
          outlined
          hide-details
          class="rounded-lg caption"
          style="max-width: 80px;"
          color="primary"
        ></v-select>
        <span class="caption grey--text ml-3 mr-4">รายการต่อหน้า</span>
        <span class="caption font-weight-medium mr-4">1-10 จาก 20</span>
        
        <v-btn-toggle dense class="rounded-lg mr-2" borderless>
          <v-btn small class="white"><v-icon small>mdi-chevron-left</v-icon></v-btn>
          <v-btn small class="white"><v-icon small>mdi-chevron-right</v-icon></v-btn>
        </v-btn-toggle>
      </v-row>

    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      expanded: [],
      stats: [
        { label: 'ทั้งหมด', count: 30, icon: 'mdi-file-document-outline', iconColor: '#1976D2', bg: '#E3F2FD', borderColor: '#BBDEFB' },
        { label: 'รอหัวหน้าอนุมัติ', count: 11, icon: 'mdi-clock-time-four-outline', iconColor: '#F57C00', bg: '#FFF3E0', borderColor: '#FFE0B2' },
        { label: 'รอ HR อนุมัติ', count: 11, icon: 'mdi-account-clock-outline', iconColor: '#FFA000', bg: '#FFF8E1', borderColor: '#FFECB3' },
        { label: 'อนุมัติ', count: 4, icon: 'mdi-check-circle-outline', iconColor: '#388E3C', bg: '#E8F5E9', borderColor: '#C8E6C9' },
        { label: 'HR ไม่อนุมัติ', count: 4, icon: 'mdi-close-circle-outline', iconColor: '#D32F2F', bg: '#FFEBEE', borderColor: '#FFCDD2' },
        { label: 'หัวหน้าไม่อนุมัติ', count: 4, icon: 'mdi-close-box-outline', iconColor: '#D32F2F', bg: '#FFEBEE', borderColor: '#FFCDD2' },
        { label: 'ยกเลิก', count: 4, icon: 'mdi-cancel', iconColor: '#616161', bg: '#F5F5F5', borderColor: '#E0E0E0' },
      ],
      headers: [
        { text: 'ลำดับ', value: 'rank', align: 'center', sortable: false, width: '50px' },
        { text: 'ตำเเหน่ง', value: 'empCode', sortable: false, class: 'grey--text text--darken-2' },
        { text: 'ชื่อ-นามสกุล/รหัสพนักงาน', value: 'name', sortable: false, class: 'font-weight-bold' },
        { text: 'ตำเเหน่ง', value: 'position', sortable: false },
        { text: 'ตำเเหน่ง', value: 'department', sortable: false },
        { text: 'บริษัท', value: 'company', sortable: false },
        { text: 'จำนวนรายการที่เบิก', value: 'itemsCount', align: 'center', sortable: false },
        { text: 'จำนวนชั่วโมง', value: 'totalHours', align: 'center', sortable: false },
        { text: '', value: 'data-table-expand', align: 'end' },
      ],
      subHeaders: [
        { text: 'ลำดับ', value: 'id', align: 'center', sortable: false, class: 'caption' },
        { text: 'หมายเลขคำร้อง', value: 'reqNo', sortable: false, class: 'caption' },
        { text: 'รายละเอียด', value: 'detail', sortable: false, class: 'caption' },
        { text: 'จำนวนชั่วโมง', value: 'hours', align: 'center', sortable: false, class: 'caption' },
        { text: 'วัน-เวลาที่เริ่ม', value: 'start', sortable: false, class: 'caption' },
        { text: 'วัน-เวลาที่สิ้นสุด', value: 'end', sortable: false, class: 'caption' },
        { text: 'วันที่ทำรายการ', value: 'transDate', sortable: false, class: 'caption' },
        { text: 'สถานะ', value: 'status', align: 'center', sortable: false, class: 'caption' },
        { text: '', value: 'action', align: 'center', sortable: false },
      ],
      employees: [
        {
          id: 1, rank: 1, empCode: '61300', name: 'นายกฤษณภูมิ พิบูลสงคราม', position: 'Business', department: 'ส่วนงาน Business', company: 'iRecruit', itemsCount: 3, totalHours: '6 ชั่วโมง', requests: []
        },
        {
          id: 2, rank: 2, empCode: '61301', name: 'นายพุฒิพงศ์ อัสสรัตนกุล', position: 'Business', department: 'ส่วนงาน Business', company: 'iRecruit', itemsCount: 3, totalHours: '6 ชั่วโมง',
          requests: [
            { id: 1, reqNo: 'OT-256409000054', detail: 'Wireframe\nการเบิกค่าล่วงเวลา', hours: '6 ชั่วโมง', start: '12/09/2565 15.00 น.', end: '12/09/2565 21.00 น.', transDate: '20/09/2565', status: 'รออนุมัติ' },
            { id: 2, reqNo: 'OT-256409000054', detail: 'Wireframe\nการเบิกค่าล่วงเวลา', hours: '6 ชั่วโมง', start: '12/09/2565 15.00 น.', end: '12/09/2565 21.00 น.', transDate: '20/09/2565', status: 'อนุมัติแล้ว' },
            { id: 3, reqNo: 'OT-256409000054', detail: 'Wireframe\nการเบิกค่าล่วงเวลา', hours: '6 ชั่วโมง', start: '12/09/2565 15.00 น.', end: '12/09/2565 21.00 น.', transDate: '20/09/2565', status: 'ไม่อนุมัติ' },
            { id: 4, reqNo: 'OT-256409000054', detail: 'Wireframe\nการเบิกค่าล่วงเวลา', hours: '6 ชั่วโมง', start: '12/09/2565 15.00 น.', end: '12/09/2565 21.00 น.', transDate: '20/09/2565', status: 'ยกเลิก' },
          ]
        },
        { id: 3, rank: 3, empCode: '61303', name: 'นายพาริส อินทรโกมาลย์สุต', position: 'Business', department: 'ส่วนงาน Business', company: 'iRecruit', itemsCount: 3, totalHours: '6 ชั่วโมง', requests: [] },
        { id: 4, rank: 4, empCode: '61304', name: 'นายซันนี่ สุวรรณเมธานนท์', position: 'Business', department: 'ส่วนงาน Business', company: 'iRecruit', itemsCount: 3, totalHours: '6 ชั่วโมง', requests: [] },
      ]
    };
  },
  methods: {
    getStatusColor(status) {
      switch (status) {
        case 'รออนุมัติ': return { bg: '#FFF8E1', text: '#FF8F00', icon: 'mdi-clock-outline' }; 
        case 'อนุมัติแล้ว': return { bg: '#E8F5E9', text: '#2E7D32', icon: 'mdi-check-circle' };
        case 'ไม่อนุมัติ': return { bg: '#FFEBEE', text: '#C62828', icon: 'mdi-close-circle' };
        case 'ยกเลิก': return { bg: '#F5F5F5', text: '#757575', icon: 'mdi-cancel' };
        default: return { bg: 'grey', text: 'white', icon: 'mdi-help' };
      }
    }
  },
  mounted() {
    this.expanded.push(this.employees[1]);
  }
};
</script>

<style>
/* Import Font (ใส่ใน index.html ก็ได้) */
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

/* Main Table Styling */
.custom-table.v-data-table {
  border: 1px solid #E0E0E0;
}

/* Custom Table Header */
.custom-table .v-data-table-header th {
  background-color: #EEEEEE !important; /* สีเทาเข้มขึ้นสำหรับหัวตาราง */
  color: #424242 !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
}

/* Row Hover Effect */
.custom-table tbody tr:hover:not(.v-data-table__expanded__content) {
  background-color: #F0F7FF !important; /* สีฟ้าจางๆ เมื่อเอาเมาส์ชี้ */
}

/* Nested Table Styling */
.transparent-table {
  background-color: transparent !important;
}
.transparent-table .v-data-table-header th {
  background-color: transparent !important;
  color: #757575 !important;
  border-bottom: 1px solid #E0E0E0 !important;
}

/* Custom Text Field Input Background */
.custom-text-field .v-input__slot {
  background-color: #F7F9FC !important;
}
</style>