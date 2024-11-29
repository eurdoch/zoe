import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, GestureResponderEvent } from 'react-native';
import { ReactNativeZoomableView, ZoomableViewEvent } from '@openspacelabs/react-native-zoomable-view';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G 
} from 'react-native-svg';
import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import DataPoint from './types/DataPoint';
import { formatTime } from './utils';

interface ScatterPlotProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  title?: string;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  onDataPointClick: (point: DataPoint) => void;
  zoomAndPanEnabled?: boolean;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  margins = { top: 20, right: 20, bottom: 50, left: 50 },
  title,
  onDataPointClick,
  zoomAndPanEnabled = true,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  const chartDetails = useMemo(() => {
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const xExtent = d3Array.extent(data, d => d.x) as [number, number];
    const yExtent = d3Array.extent(data, d => d.y) as [number, number];

    const xScale = d3Scale.scaleLinear()
      .domain([
        xExtent[0] - (xExtent[1] - xExtent[0]) * 0.1, 
        xExtent[1] + (xExtent[1] - xExtent[0]) * 0.1
      ])
      .range([0, innerWidth]);
    const yScale = d3Scale.scaleLinear()
      .domain([
        yExtent[0] - (yExtent[1] - yExtent[0]) * 0.1, 
        yExtent[1] + (yExtent[1] - yExtent[0]) * 0.1
      ])
      .range([innerHeight, 0]);

    const points = data.map(d => ({
      x: xScale(d.x),
      y: yScale(d.y),
      originalData: d
    }));

    return { 
      xScale, 
      yScale, 
      points, 
      innerWidth, 
      innerHeight,
      xExtent,
      yExtent
    };
  }, [data, width, height, margins]);

  const xTicks = useMemo(() => 
    chartDetails.xScale.ticks(5).map(tick => ({
      value: tick,
      x: chartDetails.xScale(tick)
    })), 
  [chartDetails]
  );

  const yTicks = useMemo(() => 
    chartDetails.yScale.ticks(5).map(tick => ({
      value: tick,
      y: chartDetails.yScale(tick)
    })), 
  [chartDetails]
  );

  const handleSingleTap = (event: GestureResponderEvent, zoomableViewEvent: ZoomableViewEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const adjustedX = (locationX - margins.left) / zoomableViewEvent.zoomLevel;
    const adjustedY = (locationY - margins.top) / zoomableViewEvent.zoomLevel;

    const radius = 20 / zoomableViewEvent.zoomLevel;
    const closestPoint = chartDetails.points.find(point => {
      const dx = point.x - adjustedX;
      const dy = point.y - adjustedY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });

    if (closestPoint) {
      setSelectedPoint(closestPoint.originalData);
      onDataPointClick?.(closestPoint.originalData);
    } else {
      setSelectedPoint(null);
    }
  };

  const handleDataPointClick = (point: DataPoint) => {
  }

  return (
    <View style={styles.container}>
      <Text>{title}</Text>
      <View style={[styles.chartContainer, { width, height }]}>
        <ReactNativeZoomableView
          maxZoom={10}
          minZoom={0.5}
          zoomStep={0.5}
          initialZoom={1}
          bindToBorders={true}
          onSingleTap={handleSingleTap}
          style={styles.zoomableView}
          zoomEnabled={zoomAndPanEnabled}
          panEnabled={zoomAndPanEnabled}
        >
          <Svg width={width} height={height}>
            <G x={margins.left} y={margins.top}>
              {/* Data Points */}
              {chartDetails.points.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill={selectedPoint === point.originalData ? "#ff0000" : "#007bff"}
                  stroke={selectedPoint === point.originalData ? "#ff0000" : "#007bff"}
                  strokeWidth={2}
                  onPress={() => handleDataPointClick(point.originalData)}
                />
              ))}

              {/* X-axis */}
              <Line
                x1={0}
                y1={chartDetails.innerHeight}
                x2={chartDetails.innerWidth}
                y2={chartDetails.innerHeight}
                stroke="#000"
                strokeWidth={2}
              />

              {/* Y-axis */}
              <Line
                x1={0}
                y1={0}
                x2={0}
                y2={chartDetails.innerHeight}
                stroke="#000"
                strokeWidth={2}
              />

              {/* X-axis ticks */}
              {xTicks.map((tick, i) => (
                <G key={`x-tick-${i}`}>
                  <Line
                    x1={tick.x}
                    y1={chartDetails.innerHeight}
                    x2={tick.x}
                    y2={chartDetails.innerHeight + 6}
                    stroke="#000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={tick.x}
                    y={chartDetails.innerHeight + 15}
                    fontSize={12}
                    fill="#000"
                    textAnchor="middle"
                  >
                    {formatTime(tick.value)}
                  </SvgText>
                </G>
              ))}

              {/* Y-axis ticks */}
              {yTicks.map((tick, i) => (
                <G key={`y-tick-${i}`}>
                  <Line
                    x1={0}
                    y1={tick.y}
                    x2={-6}
                    y2={tick.y}
                    stroke="#000"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={-15}
                    y={tick.y}
                    fontSize={12}
                    fill="#000"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {tick.value}
                  </SvgText>
                </G>
              ))}
            </G>
          </Svg>
        </ReactNativeZoomableView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  chartContainer: {
    position: 'relative',
  },
  zoomableView: {
    width: '100%',
    height: '100%',
  }
});

export default ScatterPlot;
