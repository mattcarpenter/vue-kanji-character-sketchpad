<template>
  <div class="sketchpad-container" v-bind:style="containerStyle" ref="sketchpad-container">
    <svg-sketch ref="sketch"
                @draw-stop="onDrawStop"
                :disabled="disabled"
                :width="dimensions.width"
                :height="dimensions.height"
                :key="dimensions.width"
                size="20"
                color="#000000"></svg-sketch>
    <div class="sketchpad-guide" ref="sketchpad-guide"></div>
  </div>
</template>

<script>
import { fromXml } from './lib/kanji'
import urlSvgLoader from './lib/url-svg-loader'
import svgSketch from 'vue-svg-sketch'

const DEFAULT_MAX_WIDTH = 500
const DEFAULT_HEIGHT = 500

export default {
  name: 'kanji-character-sketchpad',
  components: {
    svgSketch
  },
  props: {
    maxWidth: {
      type: Number,
      required: false
    },
    svgRepositoryBaseUrl: {
      type: String,
      required: false
    },
    character: {
      type: String,
      required: false
    }
  },
  methods: {
    onDrawStop() {
      console.log(this.$refs.sketch.getJSON()) //eslint-disable-line
    }
  },
  data: function () {
    return {
      height: null,
      width: null,
      disabled: false
    }
  },
  computed: {
    containerStyle: function () {
      return {
        maxWidth: (this.$props.maxWidth || DEFAULT_MAX_WIDTH) + 'px',
        height: (this.$data.height || DEFAULT_HEIGHT) + 'px'
      }
    },
    dimensions: function () {
      return {
        width: this.$data.width || 0,
        height: this.$data.height || 0
      }
    }
  },
  watch: {
    character: {
      immediate: true,
      handler: async function (newVal) {
        const originalSvgXml = await urlSvgLoader(this.$props.svgRepositoryBaseUrl, newVal)
        const kanji = fromXml(originalSvgXml)
        const dimensions = kanji.getDimensions()
        const sketchpadContainerEl = this.$refs['sketchpad-container']
        const sketchpadWidth = sketchpadContainerEl.clientWidth
        const sketchpadHeight =  dimensions.height * sketchpadWidth / dimensions.width
        const scaledSvgXml = kanji.getXml(sketchpadWidth, sketchpadHeight)

        // Load the guide SVG into the DOM
        this.$refs['sketchpad-guide'].innerHTML = scaledSvgXml

        // Adjust the container to fit the character nicely
        this.$set(this, 'height', sketchpadHeight)
        this.$set(this, 'width', sketchpadWidth)
      }
    }
  }
}
</script>

<style>
.sketchpad-container {
  border: dashed 1px #CFCFCF;
  background-color: #FCFCFC;
  position: relative;
}

.sketchpad-guide {
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
}

.sketchpad-guide > svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.svg-sketch {
  z-index: 9000;
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
}

.svg-sketch > svg {
  overflow: visible
}
</style>
