<template>
  <div class="sketchpad-container" v-bind:style="containerStyle" ref="sketchpad-container">
    <div class="sketchpad-guide" ref="sketchpad-guide"></div>
  </div>
</template>

<script>

import { fromXml } from './lib/kanji'
import urlSvgLoader from './lib/url-svg-loader'

const DEFAULT_MAX_WIDTH = 500
const DEFAULT_HEIGHT = 500

export default {
  name: 'kanji-character-sketchpad',
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
        this.$refs['sketchpad-guide'].innerHTML = scaledSvgXml
        this.$set(this, 'height', sketchpadHeight)
      }
    }
  }
}
</script>

<style>
.sketchpad-container {
  border: solid 1px #CCCCCC;
  background-color: #EFEFEF;
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
  height: 100%
}
</style>
