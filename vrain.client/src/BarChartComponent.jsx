/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';
const BarChartComponent = ({ dataChart, chartHeight, opview }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const exportChartToExcel = (dataChart, dimensions, stationNames) => {
        const worksheet = XLSX.utils.json_to_sheet(dataChart, { header: dimensions });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, "Dữ liệu trạm đo mưa " + stationNames + ' chart_data_' + new Date().getTime() +'.xlsx');
    };
    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstanceRef.current) {
            chartInstanceRef.current.dispose();
        }

        const chart = echarts.init(chartRef.current);
        chartInstanceRef.current = chart;
        if (dataChart.length > 0) {
            const stationNames = dataChart.length > 0 ? Object.keys(dataChart[0]).filter(key => key !== 'timepoint') : [];
            const dimensions = opview != 3 ? ['timepoint', ...stationNames, 'Dự báo mưa', 'Mưa tích lũy dự báo'] : ['timepoint', ...stationNames];
            const option = {
                legend: {},
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                },
                toolbox: {
                    feature: {
                        myExportExcel: {
                            show: true,
                            title: 'Export to Excel',
                            icon: 'path://M15.608,6.262h-2.338v0.935h2.338c0.516,0,0.934,0.418,0.934,0.935v8.879c0,0.517-0.418,0.935-0.934,0.935H4.392c-0.516,0-0.935-0.418-0.935-0.935V8.131c0-0.516,0.419-0.935,0.935-0.935h2.336V6.262H4.392c-1.032,0-1.869,0.837-1.869,1.869v8.879c0,1.031,0.837,1.869,1.869,1.869h11.216c1.031,0,1.869-0.838,1.869-1.869V8.131C17.478,7.099,16.64,6.262,15.608,6.262z M9.513,11.973c0.017,0.082,0.047,0.162,0.109,0.226c0.104,0.106,0.243,0.143,0.378,0.126c0.135,0.017,0.274-0.02,0.377-0.126c0.064-0.065,0.097-0.147,0.115-0.231l1.708-1.751c0.178-0.183,0.178-0.479,0-0.662c-0.178-0.182-0.467-0.182-0.645,0l-1.101,1.129V1.588c0-0.258-0.204-0.467-0.456-0.467c-0.252,0-0.456,0.209-0.456,0.467v9.094L8.443,9.553c-0.178-0.182-0.467-0.182-0.645,0c-0.178,0.184-0.178,0.479,0,0.662L9.513,11.973z',
                            onclick: function () {
                                exportChartToExcel(dataChart, dimensions , stationNames[0]);
                            }
                        },
                    }
                },
                dataset: {
                    dimensions: dimensions,
                    source: dataChart
                },
                grid: {
                    left: '13%', 
                },
                xAxis: { type: 'category' },
                yAxis: [
                    {
                        type: 'value',
                        name: 'bar',
                        axisLabel: {
                            formatter: '{value} ml'
                        },
                    },
                    {
                        type: 'value',
                        name: 'line',
                        axisLabel: {
                            formatter: '{value} ml'
                        },
                    },
                ],
                series: [
                    {
                        type: 'bar',
                        large: true,
                        barMaxWidth: 40,
                        yAxisIndex: 0,
                        tooltip: {
                            valueFormatter: function (value) {
                                return value !== undefined ? value + ' ml' : '-';
                            }
                        },
                    },
                    {
                        type: 'line',
                        large: true,
                        yAxisIndex: 1,
                        tooltip: {
                            valueFormatter: function (value) {
                                return value !== undefined ? value + ' ml' : '-';
                            }
                        },
                    },
                    ...(opview != 3 ? [{
                        type: 'bar',
                        large: true,
                        barMaxWidth: 40,
                        yAxisIndex: 0,
                        tooltip: {
                            valueFormatter: function (value) {
                                return value !== undefined ? value + ' ml' : '-';
                            }
                        },
                        },
                        {
                            type: 'line',
                            large: true,
                            yAxisIndex: 1,
                            tooltip: {
                                valueFormatter: function (value) {
                                    return value !== undefined ? value + ' ml' : '-';
                                }
                            },
                        },
                    ] : [])
                    
                
                ],
                dataZoom: [
                    {
                        type: 'inside', // Cuộn bằng cách sử dụng chuột
                        start: 0,
                        end: 100
                    },
                    {
                        type: 'slider', // Cuộn bằng cách sử dụng thanh trượt
                        start: 0,
                        end: 100
                    }
                ]
            };
            chart.setOption(option);
            return () => {
                if (chartInstanceRef.current) {
                    chartInstanceRef.current.dispose();
                }
            };
        } 
    }, [dataChart]);

    return <div className='ebarchart' ref={chartRef} style={{ width: '100%', height: chartHeight }}></div>;
};

export default BarChartComponent;
