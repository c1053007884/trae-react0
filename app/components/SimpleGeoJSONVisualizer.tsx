import React, { useState, useEffect } from 'react';

interface SimpleGeoJSONVisualizerProps {
  dataSourceId?: string;
  heightField?: string;
  heightScale?: number;
}

export function SimpleGeoJSONVisualizer({
  dataSourceId = 'points',
  heightField,
  heightScale
}: SimpleGeoJSONVisualizerProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // 添加消息到状态并输出到控制台
  const addMessage = (message: string) => {
    const fullMessage = `${new Date().toLocaleTimeString()}: ${message}`;
    console.log('[SIMPLE_DEBUG]', fullMessage);
    setMessages(prev => [...prev, fullMessage]);
  };
  
  useEffect(() => {
    // 组件挂载时的消息
    addMessage(`组件已挂载，数据源: ${dataSourceId}`);
    addMessage(`高度字段: ${heightField || '未设置'}`);
    addMessage(`高度缩放因子: ${heightScale !== undefined ? heightScale : '未设置'}`);
    
    // 设置定时器更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // 模拟一些操作
    const timeout = setTimeout(() => {
      addMessage('模拟数据加载完成');
    }, 1000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
      addMessage('组件将被卸载');
    };
  }, [dataSourceId, heightField, heightScale]);
  
  // 模拟重新加载数据
  const handleReload = () => {
    addMessage(`重新加载数据源: ${dataSourceId}`);
  };
  
  return (
    <div style={{ 
      height: '100%', 
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>GeoJSON 可视化测试组件</h2>
        <p style={{ color: '#666' }}>当前时间: {currentTime}</p>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>当前配置:</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>数据源 ID:</strong> {dataSourceId}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>高度字段:</strong> {heightField || '未设置'}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <strong>高度缩放因子:</strong> {heightScale !== undefined ? heightScale : '未设置'}
        </div>
        <button 
          onClick={handleReload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载数据
        </button>
      </div>
      
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        borderRadius: '8px',
        padding: '15px',
        flex: 1,
        overflowY: 'auto'
      }}>
        <h4 style={{ marginBottom: '15px', color: '#ecf0f1' }}>实时调试日志:</h4>
        {messages.length === 0 ? (
          <div style={{ color: '#95a5a6' }}>等待日志输出...</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.5' }}>
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}