<template>
  <div :class="{ container: true, active: active }">
    <div class="backdrop"></div>
    <div class="menu-content">
      <button class="close-button" @click="$emit('close')">X</button>
      <!-- <slot></slot> -->
      <div
        v-for="item in menuData"
        :key="item.name"
        @click="getHandler(item, 0)"
        class="menu-item"
      >
        <button class="menubt">{{ item.name }}</button>
        <div class="submenu" v-if="item.submenu && activeSubMenu === item.name">
          <button class="menubt menubt--back" @click.stop="subMenu = null">
            back
          </button>
          <button
            v-for="subitem in item.submenu"
            :key="subitem.name"
            @click="getHandler(subitem, 1)"
            class="submenu-item menubt"
          >
            {{ subitem.name }}
            <input
              :ref="`l1.${subitem.name}`"
              :checked="subitem.checked"
              v-if="subitem.type === 'toggle'"
              type="checkbox"
            />
            <!--  -->
            <div
              class="leveltwo"
              v-if="subitem.submenu && L2Menu === subitem.name"
            >
              <button class="menubt menubt--back" @click.stop="L2Menu = null">
                back
              </button>
              <button
                v-for="l2item in subitem.submenu"
                :key="l2item.name"
                @click.stop="getHandler(l2item, 2)"
                class="submenu-item menubt"
              >
                {{ l2item.name }}
                <input
                  :ref="`l2.${l2item.name}`"
                  :checked="l2item.checked"
                  v-if="l2item.type === 'toggle'"
                  type="checkbox"
                />
              </button>
            </div>
            <!--  -->
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCookie } from "@/common";
import { debounce } from "debounce";
import { mapGetters } from "vuex";

export default Vue.extend({
  props: {
    active: Boolean,
    menuData: Array
  },
  created() {},
  name: "sideMenu",
  data() {
    return {
      subMenu: null,
      activeL2Menu: null,
      L2Menu: null
    };
  },
  computed: {
    activeSubMenu() {
      return this.subMenu;
    }
  },
  methods: {
    getHandler(item, level) {
      console.log("handle", item);
      if (item.type === "click" && item.handler) {
        return item.handler();
      }
      if (item.type === "submenu") {
        this.subMenu = item.name;
      }
      if (item.type === "l2menu") {
        this.L2Menu = item.name;
      }
      if (item.type === "toggle") {
        item.checked = !item.checked;
        this.$refs[`l${level}.${item.name}`].checked = item.checked;
        item.change(item.checked);
      }
      if (item.type === "sound") {
        new Audio(item.src).play();
        item.handler(item.src.substring(1));
      }
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@keyframes slideout {
  from {
    width: 0px;
  }
  to {
    width: 100%;
  }
}

.container {
  transition: min-width 0.3s ease-in, max-width 0.3s ease-in, width 0.3s ease-in;
  display: inline-flex;
  position: fixed;
  left: 0px;
  top: 0px;
  width: 0%;
  min-width: 0px;
  max-width: 350px;
  z-index: 1000;
  height: 100vh;
  overflow: hidden;
}

.menubt {
  border: none;
  font-size: 18px;
  margin: 8px 0px;
  cursor: pointer;
  border-bottom: 1px solid white;
  color: white;
  background-color: transparent;
  white-space: nowrap;
  text-overflow: ellipsis;
  &:hover {
    font-weight: bold;
    background-color: transparent;
  }
}

.menubt--back,
.close-button {
  position: absolute;
  top: 0px;
  left: 0px;
}

.menu-content,
.submenu,
.leveltwo {
  padding-top: 16px;
  display: inline-flex;
  align-items: center;
  flex-direction: column;
}

.submenu,
.leveltwo {
  position: fixed;
  top: 0px;
  left: 0px;
  height: 100vh;
  background: linear-gradient(89.81deg, #3a6136 0.03%, #005d40 64.36%);
  color: white;
  width: 0px;
  max-width: 350px;
  animation: slideout 0.3s ease-out forwards;
}

.menu-content {
  z-index: 1000;
  width: 100%;
  background: linear-gradient(89.81deg, #3a6136 0.03%, #005d40 64.36%);
}

.close-button {
  align-self: flex-end;
  background-color: transparent;
  color: white;
  font-weight: bold;
  border: none;
  padding: 4px;
  cursor: pointer;
}

.backdrop {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.8);
  display: none;
}

.container.active {
  width: 30%;
  min-width: 350px;

  .backdrop {
    display: block;
  }
}

@media (max-width: 576px) {
  .container.active {
    width: 100%;
    max-width: 100%;
  }
  .submenu,
  .leveltwo {
    max-width: 100%;
  }
}
</style>
