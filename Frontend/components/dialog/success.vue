<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <v-dialog v-if="$vuetify.breakpoint.mobile" v-model="dialog" persistent max-width="340">
      <v-card rounded="xl" class="display-success">
        <v-card-title class="icon-success">
          <v-icon size="83" color="#52C41A">
            mdi-check-circle
          </v-icon>
        </v-card-title>
        <v-card-text class="text-success">
          <p class="text-14-1">
            {{ textStatus.mainText }}
          </p>
          <div class="btn-success">
            <v-btn class="rad-12" color="#4E9BC9" dark @click="close">
              ปิด
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-else v-model="dialog" persistent max-width="400">
      <v-card rounded="xl" class="display-success">
        <v-card-title class="icon-success">
          <v-icon size="83" color="#52C41A">
            mdi-check-circle
          </v-icon>
        </v-card-title>
        <v-card-text class="text-success">
          <p class="text-14">
            {{ textStatus.mainText }}
          </p>
          <div class="btn-success">
            <v-btn class="rad-12" color="#4E9BC9" dark @click="close">
              ปิด
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
export default {
  props: {
    textStatus: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      dialog: false
    }
  },
  methods: {
    open () {
      this.dialog = true
    },
    close () {
      this.$emit('close')
      this.dialog = false
    }
  }
}
</script>

<style scoped>
>>> .v-dialog {
    overflow-y: hidden !important; /* บังคับปิด scroll */
    overflow-x: hidden !important;
    box-shadow: none !important; /* ลบเงา */
    margin: 0px;
}
.display-success, .text-success {
    display: flex;
    align-items: center;
    flex-direction: column;
}
.text-success, .icon-success {
    margin-top: 10px;
}
.btn-success {
    display: flex;
    margin-top: 10px;
    margin-bottom: 10px;
    gap: 10px;
}
/* ---- other ---- */
.text-8 {
    color: #999999;
    font-weight: 400;
    font-size: 14px;
}
.text-14 {
    font-size: 20px;
    font-weight: 700;
    color: #333333;
}
.text-14-1 {
    font-size: 18px;
    font-weight: 700;
    color: #333333;
}
.rad-12 {
    border-radius: 12px;
}
</style>
