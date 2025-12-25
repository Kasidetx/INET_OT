<template>
  <v-card flat class="rounded-xl pa-2 mb-6 white" style="border: 1px solid #EAEAEA;">
    <v-row align="center" no-gutters class="pa-2">
      <v-col cols="12" md="4" class="pr-md-4 mb-2 mb-md-0">
        <v-text-field 
          :value="value" 
          @input="$emit('input', $event)" 
          dense outlined flat hide-details
          placeholder="ค้นหาชื่อ, รหัสพนักงาน..." 
          prepend-inner-icon="mdi-magnify" 
          class="rounded-lg custom-text-field"
          background-color="#F7F9FC" 
        />
      </v-col>
      <v-col cols="auto">
        <v-btn depressed color="#E3F2FD" class="rounded-lg px-4 primary--text font-weight-bold" height="40">
            <v-icon left size="20">mdi-filter-variant</v-icon> ตัวกรอง
        </v-btn>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn outlined color="success" class="rounded-lg px-4 font-weight-bold" height="40" style="border-color: #4CAF50;">
            <v-icon left color="success">mdi-microsoft-excel</v-icon> ดาวน์โหลดไฟล์
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>
<script>
export default { name: 'FilterToolbar', props: { value: String } }
</script>
<style scoped>.custom-text-field >>> .v-input__slot { background-color: #F7F9FC !important; }</style>