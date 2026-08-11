import * as echarts from 'echarts/core'
import {
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  HeatmapChart,
  GaugeChart,
  ScatterChart,
  GraphChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  HeatmapChart,
  GaugeChart,
  ScatterChart,
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  CanvasRenderer
])

export default echarts
