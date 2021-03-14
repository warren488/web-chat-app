<template>
  <router-view />
</template>

<style lang="scss">
@import "~vue-material/dist/theme/engine";
@include md-register-theme(
  "default",
  (
    primary: #005d40,
    "primary-on-background": #005d40,
    "icon-on-background": beige,
    accent: md-get-palette-color(pink, 500),
    secondary: beige
  )
);

@import "~vue-material/dist/theme/all"; // Apply the theme
@import "~vue-material/dist/vue-material.min.css";
@import "~vue-material/dist/theme/default.css";
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
