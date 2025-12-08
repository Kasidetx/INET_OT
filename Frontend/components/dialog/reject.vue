<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-dialog v-if="$vuetify.breakpoint.mobile" v-model="dialog" persistent max-width="340">
    <v-card rounded="xl" class="display-reject">
      <v-card-title class="icon-reject">
        <v-icon size="83" color="#FF5656">
          mdi-close-circle
        </v-icon>
      </v-card-title>
      <v-card-text class="text-reject">
        <p class="text-14-1">
          {{ textStatus.mainText }}
        </p>
        <p class="text-8">
          {{ textStatus.subText }}
        </p>
        <div class="btn-reject-v-m">
          <v-btn class="rad-12" block color="primary" dark @click="close">
            ปิด
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog v-else v-model="dialog" persistent max-width="400">
    <v-card rounded="xl" class="display-reject">
      <v-card-title class="icon-reject">
        <v-icon size="83" color="#FF5656">
          mdi-close-circle
        </v-icon>
      </v-card-title>
      <v-card-text class="text-reject">
        <p class="text-14">
          {{ textStatus.mainText }}
        </p>
        <p class="text-8">
          {{ textStatus.subText }}
        </p>
        <div class="btn-reject">
          <v-btn class="rad-12" color="primary" dark @click="close">
            ปิด
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
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
.display-reject,
.text-reject {
  display: flex;
  align-items: center;
  flex-direction: column;
}
.text-reject,
.icon-reject {
  margin-top: 10px;
}
.btn-reject {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  gap: 10px;
  width: 100%;
}
/* ----- mobile ---- */
.btn-reject-v-m {
  display: flex;
  margin-top: 10px;
  margin-bottom: 10px;
  gap: 10px;
  width: 100%;
}
/* ---- other ---- */
.text-8 {
  color: #999999;
  font-weight: 400;
  font-size: 14px;
}
.text-14 {
  font-size: 16px;
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
