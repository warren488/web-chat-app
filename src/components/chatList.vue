<template>
  <div class="chatList">
    <header>
      <h1>Friends</h1>
      <input
        type="text"
        id="search"
        placeholder="Search..."
        class="search-bar"
      />
    </header>
    <ol>
      <li
        v-for="friend of friends"
        v-bind:key="friend._id"
        :id="friend._id"
        @click="$emit('open', friend._id)"
      >
        {{ friend.username }}
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "HelloWorld",
  props: {
    friends: Array
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
header h1 {
  text-align: center;
}
.chatList {
  background: linear-gradient(
    325deg,
    rgb(39, 130, 51) 0,
    rgb(110, 129, 49) 100%
  );
  padding: 5px;
  color: white;
}
ol {
  text-decoration: none;
  list-style: none;
  padding-left: 0px;
  li {
    margin: 0px;
    padding: 15px 5px 5px;
    text-transform: uppercase;
    font-weight: bold;
    width: 100%;
    border-bottom: thin white solid;
    &:hover {
      border-bottom: thin rgb(57, 83, 60) solid;
      color: rgb(57, 83, 60);
      cursor: pointer;
    }
  }
}
.search-bar {
  border: none;
  width: 100%;
  padding: 6px;
  display: block;
}
</style>
