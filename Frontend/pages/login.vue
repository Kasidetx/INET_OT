<template>
  <v-row>
    <v-col md="6" cols="12" class="d-flex justify-center align-center login-image-col">
      <img
        :src="require('~/assets/img/img_login.png')"
        style="max-width: 100%; height: auto; border-radius: 1rem 0 0 1rem; padding: 24px;"
        contain
      >
    </v-col>
    <v-col md="6" cols="12" class="d-flex justify-center align-center">
      <v-card flat>
        <v-row no-gutters>
          <v-col cols="auto">
            <p class="text-head">ยินดีต้อนรับ!</p>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="auto">
            <p class="text-sub">ระบบลงทะเบียนโครงสร้างธุรกิจ</p>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="auto">
            <p class="text-sub2">เข้าสู่ระบบบัญชีของคุณ</p>
          </v-col>
        </v-row>
        <ValidationObserver v-slot="{ invalid, handleSubmit }">
          <form @submit.prevent="handleSubmit(login)">
            <div class="display-1 mt-6">
              <p class="text-1">
                ชื่อผู้ใช้งาน<span class="text-red">*</span>
              </p>
              <ValidationProvider name="CitizenId" rules="required" v-slot="{ errors }">
                <v-text-field
                  v-model="form.username"
                  :error-messages="errors"
                  placeholder="Username"
                  type="text"
                  outlined
                  dense
                  color="primary"
                ></v-text-field>
              </ValidationProvider>
            </div>
            <div class="display-1">
              <p class="text-1">
                รหัสผ่าน<span class="text-red">*</span>
              </p>
              <ValidationProvider name="TelPhone" rules="required" v-slot="{ errors }">
                <v-text-field
                  v-model="form.password"
                  :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                  :error-messages="errors"
                  placeholder="Password"
                  :type="show1 ? 'text' : 'password'"
                  outlined
                  dense
                  color="primary"
                  @click:append="show1 = !show1"
                ></v-text-field>
              </ValidationProvider>
            </div>
            <div class="display-button mt-5">
              <v-btn
                color="primary"
                class="rad-12 py-4 white--text font-weight-bold"
                block
                type="submit"
                rounded
                :dark="!invalid"
                :disabled="invalid"
              >
                เข้าสู่ระบบ
              </v-btn>
            </div>
          </form>
        </ValidationObserver>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'loginPage',
  layout: 'empty',
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      profile_img: '',
      show1: false
    }
  },
  methods: {
    login () {
      alert('login')
    }
  }
}
</script>

<style scoped>
>>>.v-text-field.v-text-field--enclosed .v-text-field__details {
  padding-top: 2px;
  margin-bottom: 2px;
}
>>>.v-input input  {
  line-height: 10px !important;
}
@media (max-width: 960px) {
  .login-image-col {
    background-color: transparent !important;
    padding: 36px;
  }
}
.login-image-col {
  background-color: #E5EFFF;
}
.text-head {
  color: #333333;
  font-weight: 700;
  font-style: Bold;
  font-size: 40px;
}
.text-sub {
  color: #333333;
  font-weight: 700;
  font-style: Bold;
  font-size: 32px;
}
.text-sub2 {
  color: #989898;
  font-weight: 400;
  font-size: 24px;
}
.text-1 {
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.text-red {
  color: #ff5656;
}
</style>
