const cheerio = require('cheerio')

const XMLNS = "http://www.w3.org/2000/svg"
const PATH_SAMPLE_FACTOR = 10
const MIN_SAMPLE_LENGTH = 10

module.exports = {
  xmlToPathPoints: xmlToPathPoints,
  jsonToPathPoints: jsonToPathPoints,
  convertPointArraysToSVG: convertPointArraysToSVG,
  convertPointArraysToXML: convertPointArraysToXML
}

function xmlToPathPoints(xml) {
  const paths = []

  cheerio
    .load(xml)('path')
    .each((i, e) => {
      paths.push(svgPathDataToPoints(e.attribs.d))
    });

  return paths
}

function jsonToPathPoints(json) {
  const paths = [];

  JSON.parse(json).forEach(path => {
    paths.push(svgPathDataToPoints(path.path))
  })

  return paths
}

function svgPathDataToPoints(svgPathData) {
  let points = []
  let path = document.createElementNS(XMLNS, 'path')
  
  path.setAttributeNS(null, 'd', svgPathData)
  
  let sampleLength = path.getTotalLength() / PATH_SAMPLE_FACTOR
  let currentLengthToSample = 0

  while (currentLengthToSample < path.getTotalLength()) {
    let svgPoint = path.getPointAtLength(currentLengthToSample)
    
    points.push({
      x: svgPoint.x,
      y: svgPoint.y
    })
    
    currentLengthToSample += Math.min(sampleLength, MIN_SAMPLE_LENGTH)
  }

  return points
}

function convertPointArraysToSVG(paths) {
  let result = []
  let i, j
  
  for (i=0; i < paths.length; i++) {
    result[i] = {
      "fill":"none",
      "stroke":"#000000",
      "path":"M",
      "stroke-opacity":1,
      "stroke-width":5,
      "stroke-linecap":"round",
      "stroke-linejoin":"round",
      "transform":[],
      "type":"path"
    }
    result[i].path += paths[i][0].x + ',' + paths[i][0].y
    for (j=1; j < paths[i].length; j++) {
      result[i].path += 'L' + paths[i][j].x + ',' + paths[i][j].y
    }
  }
  return result
}

function convertSVGtoXML(data) {
  let i, j, splitPath, point
  let svgXML = '<svg>'
 
  for(i=0; i < data.length; i++) {
    svgXML += '\n<path fill="none" stroke-opacity="1" stroke="#000000" stroke-linecap="round" stroke-width="5" stroke-linejoin="round" type="path" d="M '
    splitPath = data[i].path.slice(1).split('L')
    for(j=0; j < splitPath.length; j++) {
      point = splitPath[j].split(',')
      svgXML += point[0] + ' ' + point[1] + ' '
    }
    svgXML += '"/>'
  }
  svgXML += '\n</svg>'
  return svgXML
}

function convertPointArraysToXML(pointArrays) {
  let svg = convertPointArraysToSVG(pointArrays)
  return convertSVGtoXML(svg)
}