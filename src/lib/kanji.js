const svgUtils = require('./svg-utils')
const hausdorff = require('./hausdorff')
const turf = require('turf')

// e.g.: hausdorff distance of 50px tolerated per every 500px of width
const TOLERANCE_WIDTH = 500
const TOLERANCE = 50

export const fromXml = (xml) => {
  return new Kanji(xml)
}

function Kanji(xml) {
  this.strokes = svgUtils.xmlToPathPoints(xml)
  this.trimmedStrokes = []
  let minX
  let minY

  this.strokes.forEach(stroke => {
    stroke.forEach(point => {
      minX = typeof minX === 'undefined' ? point.x : Math.min(point.x, minX)
      minY = typeof minY === 'undefined' ? point.y : Math.min(point.y, minY)
    })
  })

  this.strokes.forEach((stroke, strokeIndex) => {
    this.trimmedStrokes[strokeIndex] = this.strokes[strokeIndex].slice(0)
    stroke.forEach((point, pointIndex) => {
      this.trimmedStrokes[strokeIndex][pointIndex].x -= minX
      this.trimmedStrokes[strokeIndex][pointIndex].y -= minY
    })
  })
}

Kanji.prototype.getStrokes = function ()  {
  return this.trimmedStrokes
}

Kanji.prototype.getDimensions = function () {
  let maxX = 0
  let maxY = 0
  this.trimmedStrokes.forEach(stroke => {
    stroke.forEach(point => {
      maxX = Math.max(point.x, maxX)
      maxY = Math.max(point.y, maxY)
    })
  })

  return {
    width: maxX,
    height: maxY
  }
}

Kanji.prototype.getXml = function (width, height) {
  let scaledStrokes = this.getScaledStrokes(width, height)
  return svgUtils.convertPointArraysToXML(scaledStrokes)
}

Kanji.prototype.getScaledStrokes = function (width, height) {
  let scaledStrokes = []
  let dimensions = this.getDimensions()
  this.trimmedStrokes.forEach((stroke, strokeIndex) => {
    scaledStrokes[strokeIndex] = this.trimmedStrokes[strokeIndex].slice(0)
    stroke.forEach((point, pointIndex) => {
      scaledStrokes[strokeIndex][pointIndex].x *= width / dimensions.width
      scaledStrokes[strokeIndex][pointIndex].y *= height / dimensions.height
    })
  })

  return scaledStrokes
}

Kanji.prototype.compareWithStrokes = function(otherStrokes, sketchpadWidth, sketchpadHeight) {
  const strokes = this.getScaledStrokes(sketchpadWidth, sketchpadHeight)
  const strokesCenter = getCenter(strokes)
  const otherStrokesCenter = getCenter(otherStrokes)
  let strokesMatched = 0
  const results = []

  strokes.forEach((stroke, strokeIndex) => {
    otherStrokes.forEach((otherStroke, otherStrokeIndex) => {
      let vector2D = { x: strokesCenter.x - otherStrokesCenter.x, y: strokesCenter.y - otherStrokesCenter.y }
      
      // todo - maybe not apply vector2d when only some strokes have been provided?
      vector2D = { x: 0, y: 0 }
      
      let h1 = hausdorff(strokes[strokeIndex], otherStrokes[otherStrokeIndex], vector2D)
      let h2 = hausdorff(otherStrokes[otherStrokeIndex], strokes[strokeIndex], { x: -1 * vector2D.x, y: -1 * vector2D.y })
      let accuracy = Math.max(h1, h2) * TOLERANCE_WIDTH / sketchpadWidth

      if (accuracy < TOLERANCE) {
        results[strokeIndex] = otherStrokeIndex
        strokesMatched++
      }
    })
  })

  return {
    match: strokesMatched === strokes.length,
    correctOrder: checkStrokeOrder(results)
  }
}

function getCenter(input) {
  const flattened = input.flat()
  const features = turf.featureCollection(flattened.map(p => turf.point([p.x, p.y])))
  const tr = turf.center(features)

  return {
    x: tr.geometry.coordinates[0],
    y: tr.geometry.coordinates[1]
  }
}

function checkStrokeOrder(matchedStrokes) {
  for (let i=0; i < matchedStrokes.length; i++) {
    if (matchedStrokes[i] !== i) {
      return false
    }
  }
  
  return true
}
