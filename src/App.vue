<template>
  <div class="sketchpad-container" v-bind:style="containerStyle">
    Hello World
  </div>
</template>

<script>
const DEFAULT_MAX_WIDTH = 500
const DEFAULT_HEIGHT = 500

export default {
  name: 'kanji-character-sketchpad',
  props: {
    maxWidth: {
      type: Number,
      required: false
    }
  },
  data: function () {
    return {
      height: null
    }
  },
  computed: {
    containerStyle: function () {
      return {
        maxWidth: (this.$props.maxWidth || DEFAULT_MAX_WIDTH) + 'px',
        height: (this.$data.height || DEFAULT_HEIGHT) + 'px'
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
