<template>
  <div class="transactions-side-menu">
    <div class="side-menu-header">
      <img src="~@/assets/images/logo.png" />
      <div @click="toggleSideMenu"><i class="fa fa-lg fa-times"></i></div>
    </div>
    <div class="side-menu">
      <ul>
        <li v-for="(tab, idx) in tabData" :key="tab.name + idx">
          <div
            :class="[
              isTabActive(tab.routes) ? 'active' : '',
              'menu-group-title'
            ]"
            @click.prevent="tabAction(tab)"
          >
            <img
              :src="
                isTabActive(tab.routes) ? tab.icons.active : tab.icons.inactive
              "
            />
            <p>{{ $t(tab.titleKey) }}</p>
            <i
              v-show="tab.children.length"
              :class="[
                'fa',
                isTabActive(tab.routes) ? 'fa-angle-up' : 'fa-angle-down'
              ]"
              aria-hidden="true"
            />
          </div>
          <ul v-if="tab.children.length" :class="tab.name" class="child-tab">
            <li
              v-for="(child, cidx) in tab.children"
              :key="child.name + cidx"
              :class="isTabActive(child.routes) ? 'active' : ''"
              @click.prevent="tabAction(child)"
            >
              {{ $t(child.titleKey) }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import tabsConfig from './InterfaceSideMenu.config';
export default {
  data() {
    return {
      tabData: tabsConfig.tabs
    };
  },
  mounted() {
    // Open First side menu when this component is loaded
    const firstMenuItem = document.getElementsByClassName('child-tab')[0];
    firstMenuItem.classList.add('show-child');
  },
  methods: {
    toggleSideMenu() {
      this.$store.commit('TOGGLE_SIDEMENU');
    },
    isTabActive(routes) {
      return routes.includes(this.$route.path);
    },
    tabAction(tab) {
      if (typeof tab.children === 'undefined' || tab.children.length === 0) {
        // ==============================
        // If this is real menu link
        // ==============================
        this.toggleSideMenu();
        this.$router.push({ path: tab.routes[0] });
      } else {
        // ==============================
        // If child tabs exist
        // ==============================
        // Close all open child tabs
        const elToHide = document.getElementsByClassName('child-tab');
        Array.prototype.forEach.call(elToHide, function(el) {
          el.classList.remove('show-child');
        });
        // Show child tab
        const el = document.getElementsByClassName(tab.name)[0];
        el.classList.add('show-child');
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'InterfaceSideMenu.scss';
</style>
