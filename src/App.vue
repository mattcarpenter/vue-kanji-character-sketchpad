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
    <ul class="sketchpad-guide-stroke-labels">
      <li v-for="(value, index) in strokes"
          v-bind:key="index"
          :style="{position:'absolute',left:value[0].x + 'px', top: value[0].y + 'px'}">
        {{ index + 1 }}
      </li> 
    </ul>
    <div class="sketchpad-guide" ref="sketchpad-guide"></div>
  </div>
</template>

<script>
import { fromXml } from './lib/kanji'
import urlSvgLoader from './lib/url-svg-loader'
import svgSketch from 'vue-svg-sketch'

const svgUtils = require('./lib/svg-utils')

const DEFAULT_MAX_WIDTH = 500
const DEFAULT_HEIGHT = 500
const STROKE_ANIMATION_DURATION_MILLIS = 500

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
      const kanji = this.kanji //eslint-disable-line
      const sketchPaths = svgUtils.svgIllustrationDataToPathPoints(this.$refs.sketch.getJSON())
      console.log(kanji.compareWithStrokes(sketchPaths, this.width, this.height)) //eslint-disable-line
    },
    animateGuideStrokes() {
      let timeOffset = 0;
      this.$refs['sketchpad-guide'].querySelectorAll('path').forEach(stroke => {
        let strokeLength = stroke.getTotalLength()
        setTimeout(() => {
          stroke.style['stroke-dashoffset'] = strokeLength
          stroke.style['stroke-dasharray'] = strokeLength
          stroke.classList.add('run-animation')
          stroke.classList.remove('hide')
        }, timeOffset)
        timeOffset += STROKE_ANIMATION_DURATION_MILLIS
      })
    }
  },
  data: function () {
    return {
      height: null,
      width: null,
      disabled: false,
      strokes: [],
      kanji: null
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
        const scaledStrokes = kanji.getScaledStrokes(sketchpadWidth, sketchpadHeight)
        // Load the guide SVG into the DOM
        this.$refs['sketchpad-guide'].innerHTML = scaledSvgXml

        // Adjust the container to fit the character nicely
        this.$set(this, 'height', sketchpadHeight)
        this.$set(this, 'width', sketchpadWidth)
        this.$set(this, 'strokes', scaledStrokes)
        this.$set(this, 'kanji', kanji)

        // animation test
        this.animateGuideStrokes()
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

.sketchpad-guide, .sketchpad-guide-stroke-labels {
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
}

.sketchpad-guide-stroke-labels {
  list-style-type: none;
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

.hide {
  display: none;
}

@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}

.run-animation {
  animation: dash 0.5s ease-out forwards;
}
</style>
