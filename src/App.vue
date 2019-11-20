<template>
  <div class="sketchpad-container" v-bind:style="containerStyle" ref="sketchpad-container">
    <svg-sketch ref="sketch"
                @draw-stop="onDrawStop"
                :disabled="disabled"
                :width="dimensions.width"
                :height="dimensions.height"
                :key="dimensions.width"
                :size="sketchStrokeSize"
                :color="strokeColor"></svg-sketch>
    <ul class="sketchpad-guide-stroke-labels" v-bind:style="{display: showStrokeNumbers ? 'block' : 'none'}">
      <li v-for="(value, index) in strokes"
          v-bind:key="index"
          :style="{position:'absolute',left:value[0].x + 'px', top: value[0].y + 'px'}"
          class="noselect">
        {{ index + 1 }}
      </li> 
    </ul>
    <div class="sketchpad-guide" ref="sketchpad-guide" v-bind:style="{display: showGuide ? 'block' : 'none'}"></div>
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
    },
    showGuide: {
      type: Boolean,
      required: false
    },
    showStrokeNumbers: {
      type: Boolean,
      required: false
    },
    guideStrokeColor: {
      type: String,
      required: false,
      default: '#D0D0D0'
    },
    strokeColor: {
      type: String,
      required: false,
      default: '#444'
    },
    sketchStrokeSize: {
      type: Number,
      required: false,
      default: 20
    }
  },
  methods: {
    reset() {
      this.$refs.sketch.clean()
    },
    onDrawStop() {
      const sketchPaths = svgUtils.svgIllustrationDataToPathPoints(this.$refs.sketch.getJSON())

      if (!this.kanji || !sketchPaths.length) {
        return
      }

      this.$emit('stroke', this.kanji.compareWithStrokesScaleInvariant(sketchPaths, this.width))
      //this.$emit('stroke', this.kanji.compareWithStrokes(sketchPaths, this.width, this.height))
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
        const scaledSvgXml = kanji.getXml(sketchpadWidth, sketchpadHeight, this.$props.guideStrokeColor)
        const scaledStrokes = kanji.getScaledStrokes(sketchpadWidth, sketchpadHeight)

        // Load the guide SVG into the DOM
        this.$refs['sketchpad-guide'].innerHTML = scaledSvgXml

        // Adjust the container to fit the character nicely
        this.$set(this, 'height', sketchpadHeight)
        this.$set(this, 'width', sketchpadWidth)
        this.$set(this, 'strokes', scaledStrokes)
        this.$set(this, 'kanji', kanji)

        this.animateGuideStrokes()
      }
    }
  }
}
</script>

<style>
.sketchpad-container {
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
  pointer-events: none;
  z-index: 1;
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
  animation: dash 0.35s ease-out forwards;
}

.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Opera and Firefox */
}
</style>
