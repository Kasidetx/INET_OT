<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" :mini-variant="miniVariant" fixed width="auto" app
      style="border-radius: 0px 35px 0px 0px; width: auto" class="list">
      <div class="drawer-toggle-container">
        <v-btn icon @click="drawer = !drawer">
          <v-icon color="#0863B6"> mdi-menu </v-icon>
        </v-btn>
      </div>
      <v-row no-gutters justify="center">
        <img src="../assets/img/logoTimestamp.png" class="my-6 mx-3" max-width="230" height="100"
          style="object-fit: contain" />
      </v-row>
      <v-list dense>
        <v-subheader class="custom-subheader"> พนักงาน </v-subheader>
        <v-divider class="py-2 mx-2" />
        <v-list-item v-for="(item, index) in items_hr" :key="'hr-' + index" :to="item.to" router class="py-1">
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title style="font-size: 1rem; color: #636363; padding: 4px 0">
              {{ item.title }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="#0863B6" :clipped-left="clipped" fixed dark height="80">
      <v-app-bar-nav-icon color="#E6E6E6" @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ titleName }}</v-toolbar-title>
      <v-spacer />

      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" class="profile-button" elevation="0" height="100%" v-on="on">
            <v-avatar size="40">
              <v-img :src="loginData.profile || defaultAvatar" />
            </v-avatar>

            <div v-if="$vuetify.breakpoint.mdAndUp" class="profile-text">
              <div class="name">
                {{ loginData.fullname }}
              </div>
              <div class="position">
                {{ loginData.position }}
              </div>
            </div>

            <v-icon color="#0863B6"> mdi-chevron-down </v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout">
            <v-list-item-icon>
              <v-icon color="#D1392B"> mdi-logout </v-icon>
            </v-list-item-icon>
            <v-list-item-title style="color: #d1392b">
              ออกจากระบบ
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Content -->
    <v-main class="container">
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "DefaultLayout",
  data() {
    return {
      clipped: true,
      drawer: false,
      miniVariant: false,
      titleName: "Registration Authority",
      defaultAvatar: "https://cdn.vuetifyjs.com/images/john.jpg",
      loginData: {
        fullname: "จักรภัทร แสวงแก้ว",
        position: "",
        profile: "",
      },
      items_hr: [
        {
          icon: "mdi-clock-time-eight-outline",
          title: "ระบบเบิกค่าล่วงเวลา",
          to: "/timeattendance",
          roles: ["HR"],
        },
        {
          icon: "mdi-clock-alert",
          title: "ระบบเบิกค่าล่วงเวลา",
          to: "/overtime",
          roles: ["HR"],
        },
        {
          icon: 'mdi-clock',
          title: 'ระบบลงเวลางาน',
          to: '/overtimerequest',
          roles: ['HR']
        },
        {
          icon: 'mdi-clock',
          title: 'อนุมัติค่าล่วงเวลา',
          to: '/overtimeapprove',
          roles: ['HR']
        },
      ],
    };
  },
  methods: {
    logout() { },
  },
};
</script>

<style scoped>
.custom-color {
  color: #d1392b;
}

::v-deep .v-toolbar__content,
.v-toolbar__extension {
  padding: 12px 16px !important;
}

.custom-image {
  max-width: 230px;
  max-height: 94px;

  object-fit: contain;
}

::v-deep .v-list-group__header .v-list-item {
  padding: 0 !important;
}

.list {
  background-color: #fff;
}

::v-deep .v-list {
  padding: 0;
}

.container {
  max-width: 100%;
  background-color: #f6fafd;
}

.profile-button {
  display: flex;
  align-items: center;
  min-width: 220px;
  padding: 6px 12px;
  background: linear-gradient(90deg,
      rgba(252, 252, 252, 0.9) 0%,
      rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid #fff;
  border-radius: 16px;

  gap: 10px;
}

.profile-text {
  display: flex;
  flex-direction: column;
  margin: 0 12px;
  color: #121417;
  text-align: left;
}

.name {
  font-size: 14px;
  font-weight: 700;
}

.position {
  color: #666;
  font-size: 13px;
  font-weight: 400;
}

.drawer-toggle-container {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 0;
}

.custom-subheader {
  color: #636363;
  font-size: 1rem;
}
</style>
