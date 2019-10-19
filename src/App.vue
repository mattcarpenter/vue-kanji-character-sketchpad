<template>
  <div class="sketchpad-container" v-bind:style="containerStyle">
    Hello World
  </div>
</template>

<script>
export default {
  name: 'kanji-character-sketchpad',
  props: {
    maxWidth: {
      type: Number,
      required: false
    }
  },
  computed: {
    containerStyle: function () {
      return {
        maxWidth: (this.$props.maxWidth || 500) + 'px'
      }
    }
  },
  mounted: function () {

  }
}
</script>

<style>
.sketchpad-container {
  border: solid 1px #CCCCCC;
  background-color: #EFEFEF;
}
</style>
