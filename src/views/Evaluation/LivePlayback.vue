<template>
  <div class="live-playback-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索直播/视频标题"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterSubject" placeholder="课程类型" clearable style="width: 140px">
          <el-option label="篮球" value="篮球" />
          <el-option label="足球" value="足球" />
          <el-option label="田径" value="田径" />
          <el-option label="体操" value="体操" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Document" @click="uploadVideo">上传视频</el-button>
        <el-button type="primary" :icon="VideoCamera" @click="startLive">发起直播</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.liveCount }}</span>
        <span class="stat-label">正在直播</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalViews }}</span>
        <span class="stat-label">总观看次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.videoCount }}</span>
        <span class="stat-label">回放视频</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalDuration }}</span>
        <span class="stat-label">总时长(h)</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.maxPeakViewers }}</span>
        <span class="stat-label">历史峰值人数</span>
      </div>
    </div>

    <div class="tabs-section">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="正在直播" name="live">
          <div class="lesson-grid">
            <div v-for="(live, index) in filteredLiveStreams" :key="index" class="lesson-card">
              <div class="lesson-cover">
                <img v-if="live.frame" :src="live.frame" :alt="live.title" class="cover-image" />
                <div v-else class="cover-empty">
                  <el-icon :size="40" color="#9CA3AF"><VideoCamera /></el-icon>
                  <span class="empty-text">暂无视频源</span>
                </div>
                <span class="lesson-status-badge live">直播中</span>
              </div>
              <div class="lesson-info">
                <h4 class="lesson-title">{{ live.title }}</h4>
                <div class="lesson-meta">
                  <span><el-icon><User /></el-icon> {{ live.teacher }}</span>
                  <span><el-icon><Location /></el-icon> {{ live.subject }}</span>
                </div>
                <div class="lesson-time">
                  <el-icon><View /></el-icon>
                  <span>{{ live.viewers }} 人在线</span>
                </div>
                <div class="lesson-footer">
                  <span class="viewer-count">
                    <el-icon><Clock /></el-icon> 直播中
                  </span>
                  <div class="lesson-actions">
                    <el-button type="primary" size="small" :icon="VideoPlay" @click="viewLive(live)">进入直播</el-button>
                    <el-button text size="small" :icon="Share" @click="openShare(live)">分享</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="回放视频" name="playback">
          <div class="lesson-grid">
            <div v-for="(video, index) in filteredVideos" :key="index" class="lesson-card">
              <div class="lesson-cover">
                <img v-if="video.frame" :src="video.frame" :alt="video.title" class="cover-image" />
                <div v-else class="cover-empty">
                  <el-icon :size="40" color="#9CA3AF"><VideoCamera /></el-icon>
                  <span class="empty-text">暂无视频源</span>
                </div>
                <span class="duration-badge">{{ video.duration }}</span>
              </div>
              <div class="lesson-info">
                <h4 class="lesson-title">{{ video.title }}</h4>
                <div class="lesson-meta">
                  <span><el-icon><User /></el-icon> {{ video.teacher }}</span>
                  <span><el-icon><Location /></el-icon> {{ video.subject }}</span>
                </div>
                <div class="lesson-time">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ video.date }}</span>
                </div>
                <div class="lesson-footer">
                  <span class="viewer-count">
                    <el-icon><View /></el-icon> {{ video.views }}次观看
                  </span>
                  <div class="lesson-actions">
                    <el-button type="primary" size="small" :icon="VideoPlay" @click="viewPlayback(video)">播放</el-button>
                    <el-button text size="small" :icon="Share" @click="openShare(video)">分享</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="直播统计" name="stats">
          <div class="stats-grid">
            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">直播观看趋势</span>
              </div>
              <div ref="viewTrendChart" class="chart-container"></div>
            </div>

            <div class="chart-card">
              <div class="card-header">
                <span class="card-title">观看来源分布</span>
              </div>
              <div ref="sourceChart" class="chart-container"></div>
            </div>

            <div class="chart-card full-width">
              <div class="card-header">
                <span class="card-title">网络传输与并发能力</span>
              </div>
              <div class="network-info">
                <div class="network-mode-section">
                  <h4 class="section-subtitle">网络传输模式</h4>
                  <div class="mode-options">
                    <div class="mode-option" :class="{ active: networkMode === 'multicast' }" @click="networkMode = 'multicast'">
                      <div class="mode-icon">📡</div>
                      <div class="mode-info">
                        <div class="mode-name">组播模式</div>
                        <div class="mode-desc">适用于局域网多用户接收，节省带宽</div>
                      </div>
                      <el-tag v-if="networkMode === 'multicast'" type="success" size="small">已选择</el-tag>
                    </div>
                    <div class="mode-option" :class="{ active: networkMode === 'unicast' }" @click="networkMode = 'unicast'">
                      <div class="mode-icon">🌐</div>
                      <div class="mode-info">
                        <div class="mode-name">单播模式 (TCP)</div>
                        <div class="mode-desc">适用于互联网直播，需固定公网IP</div>
                      </div>
                      <el-tag v-if="networkMode === 'unicast'" type="success" size="small">已选择</el-tag>
                    </div>
                  </div>
                </div>

                <div class="concurrent-section">
                  <h4 class="section-subtitle">并发支持能力</h4>
                  <div class="concurrent-display">
                    <div class="concurrent-num">254</div>
                    <div class="concurrent-unit">客户端同时接收</div>
                    <el-progress :percentage="72" :stroke-width="12" :color="progressColor" />
                    <div class="concurrent-hint">当前已连接: 183 / 254</div>
                  </div>
                </div>

                <div class="cross-subnet-section">
                  <h4 class="section-subtitle">跨网段高清直播</h4>
                  <div class="cross-subnet-config">
                    <div class="subnet-row">
                      <el-switch v-model="crossSubnetEnabled" active-text="已启用" inactive-text="未启用" />
                      <span class="subnet-status" :class="{ on: crossSubnetEnabled }">{{ crossSubnetEnabled ? '跨网段传输已开启' : '仅同网段传输' }}</span>
                    </div>
                    <div class="subnet-details" v-if="crossSubnetEnabled">
                      <div class="subnet-field">
                        <span class="field-label">主网段</span>
                        <el-tag size="small">192.168.1.0/24</el-tag>
                      </div>
                      <div class="subnet-field">
                        <span class="field-label">扩展网段</span>
                        <el-tag size="small" type="success">192.168.2.0/24</el-tag>
                      </div>
                      <div class="subnet-field">
                        <span class="field-label">传输码率</span>
                        <el-select v-model="streamBitrate" size="small" style="width: 120px">
                          <el-option label="1080p 高清" value="1080p" />
                          <el-option label="720p 标清" value="720p" />
                          <el-option label="480p 流畅" value="480p" />
                        </el-select>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="dual-server-section">
                  <h4 class="section-subtitle">双服务器统一直播</h4>
                  <div class="dual-server-config">
                    <div class="server-card" :class="{ active: true }">
                      <div class="server-header">
                        <span class="server-dot online"></span>
                        <span class="server-name">主服务器（本校）</span>
                      </div>
                      <div class="server-info">
                        <span>IP: 192.168.1.100</span>
                        <span>负载: 42%</span>
                      </div>
                    </div>
                    <div class="server-link">
                      <el-icon :size="20"><Connection /></el-icon>
                      <span class="link-label">同步中</span>
                    </div>
                    <div class="server-card" :class="{ active: dualServerEnabled }">
                      <div class="server-header">
                        <span class="server-dot" :class="{ online: dualServerEnabled }"></span>
                        <span class="server-name">副服务器（分校）</span>
                      </div>
                      <div class="server-info">
                        <span>IP: 192.168.2.100</span>
                        <span>{{ dualServerEnabled ? '负载: 28%' : '未连接' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="dual-server-toggle">
                    <el-switch v-model="dualServerEnabled" active-text="双服务器模式" inactive-text="单服务器" />
                  </div>
                </div>

                <div class="client-mode-section">
                  <h4 class="section-subtitle">客户端接收模式</h4>
                  <div class="client-mode-info">
                    <div class="mode-badge passive">
                      <el-icon :size="16"><Monitor /></el-icon>
                      <span>被动接收模式</span>
                    </div>
                    <p class="mode-desc">客户端无需打开浏览器，直播端下达指令后自动接收直播画面</p>
                    <div class="client-stats">
                      <div class="client-stat">
                        <span class="client-stat-num">{{ connectedClients }}</span>
                        <span class="client-stat-label">已连接客户端</span>
                      </div>
                      <div class="client-stat">
                        <span class="client-stat-num">{{ maxClients }}</span>
                        <span class="client-stat-label">最大支持数</span>
                      </div>
                      <div class="client-stat">
                        <span class="client-stat-num">{{ autoReceiveCount }}</span>
                        <span class="client-stat-label">自动接收中</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="scene-composition-section">
                  <h4 class="section-subtitle">场景聚合功能 <el-tag type="info" size="small">多图层 · 抠像 · 实时调整</el-tag></h4>
                  <div class="composition-preview">

                    <!-- 可视化合成预览区 -->
                    <div class="visual-preview">
                      <div class="preview-canvas">
                        <div class="preview-bg-label">合成预览</div>
                        <div
                          v-for="(layer, idx) in visibleLayersReversed"
                          :key="'pv-' + layer.id"
                          class="preview-layer"
                          :style="{
                            opacity: layer.opacity / 100,
                            background: layer.color,
                            width: getPreviewLayerSize(layer).w + '%',
                            height: getPreviewLayerSize(layer).h + '%',
                            top: getPreviewLayerSize(layer).y + '%',
                            left: getPreviewLayerSize(layer).x + '%',
                            zIndex: idx + 1
                          }"
                        >
                          <span class="preview-layer-label">{{ layer.name }}</span>
                        </div>
                        <div v-if="enableChromaKey" class="preview-chroma-overlay" :class="chromaKeyColor">
                          <span>抠像区域</span>
                        </div>
                      </div>
                      <div class="preview-info-bar">
                        <span>可见图层: {{ sceneLayers.filter(l => l.visible).length }}/{{ sceneLayers.length }}</span>
                        <span v-if="enableChromaKey" class="chroma-badge">
                          <span class="chroma-badge-dot" :class="chromaKeyColor"></span>
                          {{ chromaKeyColor === 'green' ? '绿幕' : '蓝幕' }}抠像
                        </span>
                        <span v-if="isLiveStreaming" class="live-badge"><span class="live-badge-dot"></span>LIVE</span>
                      </div>
                    </div>

                    <!-- 图层列表 -->
                    <div class="layer-list">
                      <div class="layer-list-header">
                        <span class="layer-col-order">#</span>
                        <span class="layer-col-name">图层名称</span>
                        <span class="layer-col-type">类型</span>
                        <span class="layer-col-opacity">透明度</span>
                        <span class="layer-col-lock">锁定</span>
                        <span class="layer-col-visible">显示</span>
                      </div>
                      <div
                        v-for="(layer, idx) in sceneLayers"
                        :key="layer.id"
                        class="layer-item"
                        :class="{ active: selectedLayer === idx, locked: layer.locked }"
                        @click="selectedLayer = idx"
                      >
                        <span class="layer-col-order">{{ idx + 1 }}</span>
                        <span class="layer-col-name">
                          <span class="layer-type-icon"><el-icon :size="14" color="#1E5AA8"><component :is="getLayerTypeIcon(layer.typeLabel)" /></el-icon></span>
                          <span class="layer-color-dot" :style="{ background: layer.color }"></span>
                          <template v-if="editingLayerIdx === idx">
                            <input
                              class="layer-rename-input"
                              v-model="editingLayerName"
                              @blur="saveLayerName(idx)"
                              @keyup.enter="saveLayerName(idx)"
                              @keyup.escape="editingLayerIdx = null"
                              @click.stop
                              ref="renameInputRef"
                            />
                          </template>
                          <template v-else>
                            <span @dblclick.stop="startRenameLayer(idx)">{{ layer.name }}</span>
                          </template>
                        </span>
                        <span class="layer-col-type">
                          <el-tag size="small" :type="layer.tagType">{{ layer.typeLabel }}</el-tag>
                        </span>
                        <span class="layer-col-opacity">
                          <el-slider v-model="layer.opacity" :min="0" :max="100" :step="5" :show-tooltip="false" style="width: 80px" @click.stop :disabled="layer.locked" />
                        </span>
                        <span class="layer-col-lock" @click.stop>
                          <el-switch v-model="layer.locked" size="small" :active-icon="LockIcon" inline-prompt active-text="🔒" inactive-text="🔓" />
                        </span>
                        <span class="layer-col-visible" @click.stop>
                          <el-switch v-model="layer.visible" size="small" :disabled="layer.locked" />
                        </span>
                      </div>
                    </div>

                    <div class="layer-actions-row">
                      <el-button size="small" :icon="Plus" @click="addSceneLayer">添加图层</el-button>
                      <el-button size="small" :disabled="selectedLayer === null || selectedLayer === 0" @click="moveLayerUp">上移</el-button>
                      <el-button size="small" :disabled="selectedLayer === null || selectedLayer >= sceneLayers.length - 1" @click="moveLayerDown">下移</el-button>
                      <el-button size="small" type="danger" :disabled="selectedLayer === null || sceneLayers[selectedLayer]?.locked" @click="removeSceneLayer">删除图层</el-button>
                      <el-button size="small" :disabled="selectedLayer === null || sceneLayers[selectedLayer]?.locked" @click="startRenameLayer(selectedLayer)">重命名</el-button>
                    </div>

                    <!-- 场景预设 -->
                    <div class="scene-presets">
                      <div class="presets-header">
                        <span class="presets-title">场景预设</span>
                        <el-button size="small" type="primary" plain @click="saveScenePreset">保存当前场景</el-button>
                      </div>
                      <div class="presets-list" v-if="scenePresets.length > 0">
                        <div
                          v-for="(preset, pIdx) in scenePresets"
                          :key="pIdx"
                          class="preset-item"
                          :class="{ active: activePresetIdx === pIdx }"
                          @click="loadScenePreset(pIdx)"
                        >
                          <div class="preset-info">
                            <span class="preset-name">{{ preset.name }}</span>
                            <span class="preset-meta">{{ preset.layers.length }} 个图层 · {{ preset.chromaKey ? '含抠像' : '无抠像' }}</span>
                          </div>
                          <div class="preset-colors">
                            <span v-for="(l, li) in preset.layers.slice(0, 5)" :key="li" class="preset-color-chip" :style="{ background: l.color }"></span>
                          </div>
                          <el-button size="small" text type="danger" @click.stop="deleteScenePreset(pIdx)">删除</el-button>
                        </div>
                      </div>
                      <div v-else class="presets-empty">
                        <span>暂无预设，点击"保存当前场景"创建</span>
                      </div>
                    </div>

                    <!-- 抠像与效果控制 -->
                    <div class="composition-effect">
                      <div class="chroma-key-controls">
                        <el-checkbox v-model="enableChromaKey">启用蓝绿背景抠像</el-checkbox>
                        <div class="chroma-options" v-if="enableChromaKey">
                          <el-radio-group v-model="chromaKeyColor" size="small">
                            <el-radio-button label="green">绿幕</el-radio-button>
                            <el-radio-button label="blue">蓝幕</el-radio-button>
                          </el-radio-group>
                          <div class="chroma-preview-dots">
                            <span class="effect-dot green" :class="{ selected: chromaKeyColor === 'green' }"></span>
                            <span class="effect-dot blue" :class="{ selected: chromaKeyColor === 'blue' }"></span>
                          </div>
                        </div>
                        <div class="chroma-params" v-if="enableChromaKey">
                          <div class="chroma-param-row">
                            <span class="param-label">容差</span>
                            <el-slider v-model="chromaKeyTolerance" :min="0" :max="100" :step="1" :show-tooltip="false" style="flex:1" />
                            <span class="param-value">{{ chromaKeyTolerance }}%</span>
                          </div>
                          <div class="chroma-param-row">
                            <span class="param-label">平滑度</span>
                            <el-slider v-model="chromaKeySmoothness" :min="0" :max="100" :step="1" :show-tooltip="false" style="flex:1" />
                            <span class="param-value">{{ chromaKeySmoothness }}%</span>
                          </div>
                          <div class="chroma-param-row">
                            <span class="param-label">边缘消除</span>
                            <el-slider v-model="edgeSpillSuppression" :min="0" :max="100" :step="1" :show-tooltip="false" style="flex:1" />
                            <span class="param-value">{{ edgeSpillSuppression }}%</span>
                          </div>
                          <div class="chroma-param-row">
                            <span class="param-label">溢色抑制</span>
                            <el-slider v-model="spillSuppress" :min="0" :max="100" :step="1" :show-tooltip="false" style="flex:1" />
                            <span class="param-value">{{ spillSuppress }}%</span>
                          </div>
                        </div>
                      </div>
                      <div class="realtime-indicator" v-if="isLiveStreaming">
                        <span class="live-dot"></span>
                        <span>直播中 · 可实时调整</span>
                      </div>
                    </div>
                  </div>
                  <div class="composition-actions">
                    <el-button size="small" :icon="Setting" @click="showCompositionDialog = true">调整聚合内容</el-button>
                    <el-button size="small" :icon="View" @click="previewComposition">预览合成效果</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showLiveDialog" title="发起直播" width="700px">
      <el-form :model="liveForm" label-width="100px">
        <el-form-item label="直播标题">
          <el-input v-model="liveForm.title" placeholder="请输入直播标题" />
        </el-form-item>
        <el-form-item label="课程类型">
          <el-select v-model="liveForm.subject" placeholder="请选择课程类型" class="w-full">
            <el-option label="篮球" value="basketball" />
            <el-option label="足球" value="football" />
            <el-option label="田径" value="athletics" />
            <el-option label="体操" value="gymnastics" />
            <el-option label="羽毛球" value="badminton" />
            <el-option label="游泳" value="swimming" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课教师">
          <el-input v-model="liveForm.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="直播地点">
          <el-input v-model="liveForm.location" placeholder="请输入直播地点" />
        </el-form-item>
        <el-form-item label="传输模式">
          <el-radio-group v-model="liveForm.networkMode">
            <el-radio label="multicast">组播模式（局域网）</el-radio>
            <el-radio label="unicast">单播模式（互联网）</el-radio>
          </el-radio-group>
          <div class="mode-tip">
            <el-alert :title="liveForm.networkMode === 'multicast' ? '适用于学校局域网，支持多客户端同时接收，节省带宽' : '适用于互联网直播，需学校拥有固定公网IP'" type="info" :closable="false" size="small" />
          </div>
        </el-form-item>
        <el-form-item label="并发设置">
          <div class="concurrent-info">
            <span class="concurrent-num">支持 {{ liveForm.maxClients }} 个客户端</span>
            <el-slider v-model="liveForm.maxClients" :min="50" :max="254" :step="1" show-stops />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLiveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmStartLive">开始直播</el-button>
      </template>
    </el-dialog>

    <!-- 直播/回放播放器 - 三分屏 -->
    <el-dialog v-model="playerVisible" :title="playerTitle" width="1200px" destroy-on-close>
      <div class="three-screen-player">
        <!-- 主画面 -->
        <div class="main-screen">
          <div class="screen-label">主画面 - 教师授课</div>
          <div class="video-container">
            <VideoPlayer
              src="/示例视频.mp4"
              :autoplay="true"
              :show-controls="true"
              :show-timeline="true"
              :show-volume="true"
              :show-fullscreen="true"
              :show-playback-rate="true"
            />
          </div>
        </div>

        <!-- 副画面区域 -->
        <div class="side-screens">
          <!-- 副画面1 -->
          <div class="side-screen">
            <div class="screen-label">副画面1 - 学生表现</div>
            <div class="video-container small">
              <div class="video-placeholder">
                <el-icon :size="48" color="#9CA3AF"><VideoCamera /></el-icon>
                <span>学生课堂表现</span>
              </div>
            </div>
          </div>

          <!-- 副画面2 -->
          <div class="side-screen">
            <div class="screen-label">副画面2 - 课件展示</div>
            <div class="video-container small">
              <div class="video-placeholder">
                <el-icon :size="48" color="#9CA3AF"><Document /></el-icon>
                <span>PPT/课件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放器信息栏 -->
      <div v-if="playerInfo" class="player-info">
        <div class="info-row">
          <div class="info-item">
            <strong>授课教师:</strong> {{ playerInfo.teacher }}
          </div>
          <div class="info-item" v-if="playerInfo.viewers">
            <strong>在线人数:</strong> {{ playerInfo.viewers }}
          </div>
          <div class="info-item" v-if="playerInfo.peakViewers">
            <strong>峰值人数:</strong> {{ playerInfo.peakViewers }}
          </div>
          <div class="info-item" v-if="playerInfo.duration">
            <strong>时长:</strong> {{ playerInfo.duration }}
          </div>
        </div>
      </div>

      <!-- 实时评论区 -->
      <div class="live-comments-section">
        <div class="comments-header">
          <span class="comments-title">💬 实时评论</span>
          <span class="comments-count">{{ comments.length }}条</span>
        </div>
        <div class="comments-list" ref="commentsList">
          <div v-for="(comment, index) in comments" :key="index" class="comment-item" :class="{ 'is-current-user': isCurrentUser(comment.user) }">
            <div class="comment-avatar-wrapper">
              <span class="comment-avatar" :style="getAvatarStyle(comment.user)">{{ comment.user.charAt(0) }}</span>
              <span v-if="comment.role" class="comment-role-tag" :class="comment.role">{{ getRoleLabel(comment.role) }}</span>
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>
        <div class="comments-input">
          <el-input 
            v-model="newComment" 
            placeholder="发表评论..." 
            @keyup.enter="submitComment"
            size="large"
          />
          <el-button type="primary" size="large" @click="submitComment">发送</el-button>
        </div>
      </div>

      <!-- NLP分析和关键词云 -->
      <div class="nlp-analysis-section">
        <el-tabs v-model="nlpActiveTab" type="border-card">
          <el-tab-pane label="NLP分析" name="nlp">
            <div class="nlp-content">
              <div class="nlp-stats">
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">课堂互动度</span>
                  <span class="nlp-stat-value high">85%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">学生专注度</span>
                  <span class="nlp-stat-value medium">72%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">知识点覆盖</span>
                  <span class="nlp-stat-value high">90%</span>
                </div>
                <div class="nlp-stat-item">
                  <span class="nlp-stat-label">语言清晰度</span>
                  <span class="nlp-stat-value high">88%</span>
                </div>
              </div>

              <div class="nlp-timeline">
                <h4>课堂时间线分析</h4>
                <div class="timeline-events">
                  <div class="timeline-item" v-for="(event, idx) in timelineEvents" :key="idx">
                    <div class="timeline-time">{{ event.time }}</div>
                    <div class="timeline-content">
                      <span class="timeline-type" :class="event.type">{{ event.typeLabel }}</span>
                      <span class="timeline-text">{{ event.content }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="关键词云" name="keywords">
            <div class="keyword-cloud">
              <div
                v-for="(keyword, idx) in keywordCloud"
                :key="idx"
                class="keyword-item"
                :style="{ fontSize: keyword.size + 'px', color: keyword.color }"
              >
                {{ keyword.word }}
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="情感分析" name="emotion">
            <div class="emotion-analysis">
              <div class="emotion-chart">
                <div ref="emotionChart" class="chart-container"></div>
              </div>
              <div class="emotion-details">
                <div class="emotion-item">
                  <span class="emotion-label">积极</span>
                  <el-progress :percentage="65" :color="'#1E5AA8'" :stroke-width="12" />
                </div>
                <div class="emotion-item">
                  <span class="emotion-label">中性</span>
                  <el-progress :percentage="25" :color="'#F5A623'" :stroke-width="12" />
                </div>
                <div class="emotion-item">
                  <span class="emotion-label">消极</span>
                  <el-progress :percentage="10" :color="'#E85D4E'" :stroke-width="12" />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 上传视频弹窗 -->
    <el-dialog v-model="showUploadDialog" title="上传回放视频" width="560px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="视频标题" required>
          <el-input v-model="uploadForm.title" placeholder="请输入视频标题" />
        </el-form-item>
        <el-form-item label="课程类型" required>
          <el-select v-model="uploadForm.subject" placeholder="选择课程类型" class="w-full">
            <el-option label="篮球" value="basketball" />
            <el-option label="足球" value="football" />
            <el-option label="田径" value="athletics" />
            <el-option label="体操" value="gymnastics" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课教师" required>
          <el-input v-model="uploadForm.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="视频文件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
          <div class="upload-tip">支持 MP4、AVI 格式，文件大小不超过 50MB</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确认上传</el-button>
      </template>
    </el-dialog>

    <!-- 调整聚合内容弹窗 -->
    <el-dialog v-model="showCompositionDialog" title="调整聚合内容" width="600px">
      <el-form :model="compositionForm" label-width="120px">
        <el-form-item label="主画面来源">
          <el-select v-model="compositionForm.mainVideo" class="w-full">
            <el-option label="摄像头1" value="camera1" />
            <el-option label="摄像头2" value="camera2" />
            <el-option label="摄像头3" value="camera3" />
            <el-option label="屏幕共享" value="screen" />
          </el-select>
        </el-form-item>
        <el-form-item label="画中画来源">
          <el-select v-model="compositionForm.pictureInPicture" class="w-full">
            <el-option label="无画中画" value="none" />
            <el-option label="摄像头1" value="camera1" />
            <el-option label="摄像头2" value="camera2" />
            <el-option label="摄像头3" value="camera3" />
            <el-option label="屏幕共享" value="screen" />
          </el-select>
        </el-form-item>
        <el-form-item label="画中画位置">
          <el-select v-model="compositionForm.pictureInPicturePosition" class="w-full" :disabled="compositionForm.pictureInPicture === 'none'">
            <el-option label="左上角" value="top-left" />
            <el-option label="右上角" value="top-right" />
            <el-option label="左下角" value="bottom-left" />
            <el-option label="右下角" value="bottom-right" />
          </el-select>
        </el-form-item>
        <el-divider />
        <el-form-item label="叠加层设置">
          <div class="overlay-options">
            <el-checkbox v-model="compositionForm.showScoreOverlay">显示成绩叠加</el-checkbox>
            <el-checkbox v-model="compositionForm.showTimerOverlay">显示计时器</el-checkbox>
            <el-checkbox v-model="compositionForm.showCoachTips">显示教练提示</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="成绩显示位置" :disabled="!compositionForm.showScoreOverlay">
          <el-select v-model="compositionForm.scorePosition" class="w-full" :disabled="!compositionForm.showScoreOverlay">
            <el-option label="左上角" value="top-left" />
            <el-option label="右上角" value="top-right" />
            <el-option label="左下角" value="bottom-left" />
            <el-option label="右下角" value="bottom-right" />
          </el-select>
        </el-form-item>
        <el-form-item label="计时器位置" :disabled="!compositionForm.showTimerOverlay">
          <el-select v-model="compositionForm.timerPosition" class="w-full" :disabled="!compositionForm.showTimerOverlay">
            <el-option label="左上角" value="top-left" />
            <el-option label="右上角" value="top-right" />
            <el-option label="左下角" value="bottom-left" />
            <el-option label="右下角" value="bottom-right" />
          </el-select>
        </el-form-item>
        <el-divider />
        <el-form-item label="转场效果">
          <el-select v-model="compositionForm.transition" class="w-full">
            <el-option label="无" value="none" />
            <el-option label="淡入淡出" value="fade" />
            <el-option label="滑动" value="slide" />
            <el-option label="溶解" value="dissolve" />
            <el-option label="缩放" value="zoom" />
          </el-select>
        </el-form-item>
        <el-form-item label="转场时长">
          <el-slider v-model="compositionForm.transitionDuration" :min="100" :max="2000" :step="100" show-input style="width: 100%" />
          <span style="font-size: 12px; color: #9CA3AF; margin-top: 4px;">单位：毫秒</span>
        </el-form-item>
        <el-divider />
        <el-form-item label="输出分辨率">
          <el-select v-model="compositionForm.outputResolution" class="w-full">
            <el-option label="4K (3840×2160)" value="4k" />
            <el-option label="1080p (1920×1080)" value="1080p" />
            <el-option label="720p (1280×720)" value="720p" />
            <el-option label="480p (854×480)" value="480p" />
          </el-select>
        </el-form-item>
        <el-form-item label="帧率">
          <el-select v-model="compositionForm.frameRate" class="w-full">
            <el-option label="60 fps" value="60" />
            <el-option label="30 fps" value="30" />
            <el-option label="25 fps" value="25" />
            <el-option label="24 fps" value="24" />
          </el-select>
        </el-form-item>
        <el-form-item label="输出格式">
          <el-select v-model="compositionForm.outputFormat" class="w-full">
            <el-option label="MP4 (H.264)" value="mp4" />
            <el-option label="WebM (VP9)" value="webm" />
            <el-option label="MOV (ProRes)" value="mov" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompositionDialog = false">取消</el-button>
        <el-button type="primary" @click="saveComposition">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 合成效果预览弹窗 -->
    <el-dialog v-model="showPreviewDialog" title="合成效果预览" width="720px" :close-on-click-modal="true">
      <div class="preview-dialog-content">
        <div class="preview-dialog-canvas">
          <div class="preview-dialog-bg">合成预览</div>
          <div
            v-for="(layer, idx) in visibleLayersReversed"
            :key="'pd-' + layer.id"
            class="preview-dialog-layer"
            :style="{
              opacity: layer.opacity / 100,
              background: layer.color,
              width: getPreviewLayerSize(layer).w + '%',
              height: getPreviewLayerSize(layer).h + '%',
              top: getPreviewLayerSize(layer).y + '%',
              left: getPreviewLayerSize(layer).x + '%',
              zIndex: idx + 1
            }"
          >
            <span class="preview-dialog-layer-label">{{ layer.name }}</span>
          </div>
          <div v-if="enableChromaKey" class="preview-dialog-chroma" :class="chromaKeyColor">
            <span>{{ chromaKeyColor === 'green' ? '绿幕' : '蓝幕' }}抠像区域</span>
          </div>
        </div>
        <div class="preview-dialog-info">
          <div class="preview-dialog-info-row">
            <span class="info-label">可见图层</span>
            <span>{{ sceneLayers.filter(l => l.visible).length }} / {{ sceneLayers.length }}</span>
          </div>
          <div class="preview-dialog-info-row" v-if="enableChromaKey">
            <span class="info-label">抠像模式</span>
            <span :class="chromaKeyColor === 'green' ? 'text-green' : 'text-blue'">{{ chromaKeyColor === 'green' ? '绿幕' : '蓝幕' }} · 容差 {{ chromaKeyTolerance }}% · 平滑 {{ chromaKeySmoothness }}%</span>
          </div>
          <div class="preview-dialog-info-row">
            <span class="info-label">转场效果</span>
            <span>{{ { none: '无', fade: '淡入淡出', slide: '滑动', dissolve: '溶解', zoom: '缩放' }[compositionForm.transition] || '淡入淡出' }} · {{ compositionForm.transitionDuration }}ms</span>
          </div>
          <div class="preview-dialog-info-row">
            <span class="info-label">输出设置</span>
            <span>{{ compositionForm.outputResolution }} · {{ compositionForm.frameRate }}fps · {{ compositionForm.outputFormat.toUpperCase() }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 分享弹窗 -->
    <el-dialog
      v-model="showShareDialog"
      :title="`分享${currentShareItem?.type === 'live' ? '直播' : '回放'}`"
      width="500px"
    >
      <div class="share-content">
        <div class="share-qrcode">
          <div class="qrcode-placeholder">
            <svg viewBox="0 0 100 100" class="qrcode-svg">
              <rect x="10" y="10" width="80" height="80" fill="white" stroke="#E8EAED" stroke-width="1"/>
              <rect x="15" y="15" width="15" height="15" fill="#333"/>
              <rect x="70" y="15" width="15" height="15" fill="#333"/>
              <rect x="15" y="70" width="15" height="15" fill="#333"/>
              <rect x="70" y="70" width="15" height="15" fill="#333"/>
              <rect x="30" y="30" width="10" height="10" fill="#333"/>
              <rect x="60" y="30" width="10" height="10" fill="#333"/>
              <rect x="30" y="60" width="10" height="10" fill="#333"/>
              <rect x="45" y="45" width="10" height="10" fill="#333"/>
              <rect x="38" y="22" width="4" height="4" fill="#333"/>
              <rect x="48" y="22" width="4" height="4" fill="#333"/>
              <rect x="58" y="22" width="4" height="4" fill="#333"/>
              <rect x="22" y="38" width="4" height="4" fill="#333"/>
              <rect x="22" y="48" width="4" height="4" fill="#333"/>
              <rect x="22" y="58" width="4" height="4" fill="#333"/>
              <rect x="74" y="38" width="4" height="4" fill="#333"/>
              <rect x="74" y="48" width="4" height="4" fill="#333"/>
              <rect x="74" y="58" width="4" height="4" fill="#333"/>
              <rect x="38" y="74" width="4" height="4" fill="#333"/>
              <rect x="48" y="74" width="4" height="4" fill="#333"/>
              <rect x="58" y="74" width="4" height="4" fill="#333"/>
            </svg>
          </div>
          <span class="qrcode-label">扫码观看</span>
        </div>
        <div class="share-links">
          <div class="link-item">
            <label>分享链接</label>
            <el-input v-model="shareLink" readonly />
            <el-button text type="primary" @click="copyLink">复制链接</el-button>
          </div>
          <div class="share-buttons">
            <el-button type="primary" :icon="Share">生成海报</el-button>
            <el-button :icon="Document">复制二维码</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { VideoCamera, Document, Search, Refresh, User, Location, View, Clock, Calendar, VideoPlay, Share, Setting, Connection, Monitor, Plus, Lock, Picture, Collection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import echarts from '@/utils/echarts'
import { usePersistedRef } from '@/composables/usePersistedRef'
import store from '../../store/global'
import { generateDeterministicId } from '@/utils/seededRandom'
import { extractVideoFrame } from '@/utils/videoFrame'

const activeTab = ref('live')
const searchQuery = ref('')
const filterSubject = ref('')
const showLiveDialog = ref(false)
const showUploadDialog = ref(false)
const playerVisible = ref(false)
const playerTitle = ref('')
const playerInfo = ref(null)
const networkMode = ref('multicast')
const enableChromaKey = ref(false)
const crossSubnetEnabled = ref(true)
const streamBitrate = ref('1080p')
const dualServerEnabled = ref(false)
const connectedClients = ref(183)
const maxClients = ref(254)
const autoReceiveCount = ref(167)
const showCompositionDialog = ref(false)

// 场景聚合图层管理
const selectedLayer = ref(null)
const chromaKeyColor = ref('green')
const isLiveStreaming = computed(() => stats.value.liveCount > 0)
let layerIdCounter = 5
const sceneLayers = ref([
  { id: 1, name: '导播通道 - 主画面', typeLabel: '摄像机', tagType: '', color: '#1E5AA8', opacity: 100, visible: true, locked: false },
  { id: 2, name: '文字叠加 - 学校名称', typeLabel: '文字', tagType: 'success', color: '#3B82F6', opacity: 85, visible: true, locked: false },
  { id: 3, name: '摄像机2 - 教练指导', typeLabel: '摄像机', tagType: '', color: '#F5A623', opacity: 70, visible: true, locked: false },
  { id: 4, name: '抓屏画面 - 技术统计', typeLabel: '抓屏', tagType: 'warning', color: '#E85D4E', opacity: 60, visible: true, locked: false }
])

const addSceneLayer = () => {
  const types = [
    { name: '图片叠加', typeLabel: '图片', tagType: 'info', color: '#8B5CF6' },
    { name: '文字标题', typeLabel: '文字', tagType: 'success', color: '#06B6D4' },
    { name: '摄像机3', typeLabel: '摄像机', tagType: '', color: '#10B981' },
    { name: '数据面板', typeLabel: '抓屏', tagType: 'warning', color: '#F97316' }
  ]
  const t = types[layerIdCounter % types.length]
  sceneLayers.value.push({
    id: layerIdCounter++,
    name: t.name,
    typeLabel: t.typeLabel,
    tagType: t.tagType,
    color: t.color,
    opacity: 100,
    visible: true,
    locked: false
  })
  ElMessage.success('已添加新图层')
}

const removeSceneLayer = () => {
  if (selectedLayer.value !== null && selectedLayer.value >= 0 && selectedLayer.value < sceneLayers.value.length) {
    sceneLayers.value.splice(selectedLayer.value, 1)
    selectedLayer.value = null
    ElMessage.success('图层已删除')
  }
}

const moveLayerUp = () => {
  if (selectedLayer.value > 0) {
    const idx = selectedLayer.value
    const temp = sceneLayers.value[idx]
    sceneLayers.value[idx] = sceneLayers.value[idx - 1]
    sceneLayers.value[idx - 1] = temp
    selectedLayer.value = idx - 1
  }
}

const moveLayerDown = () => {
  if (selectedLayer.value < sceneLayers.value.length - 1) {
    const idx = selectedLayer.value
    const temp = sceneLayers.value[idx]
    sceneLayers.value[idx] = sceneLayers.value[idx + 1]
    sceneLayers.value[idx + 1] = temp
    selectedLayer.value = idx + 1
  }
}

const previewComposition = () => {
  showPreviewDialog.value = true
}
const showPreviewDialog = ref(false)

// 增强场景聚合 — 新增变量
const editingLayerIdx = ref(null)
const editingLayerName = ref('')
const renameInputRef = ref(null)
const LockIcon = Lock
const chromaKeyTolerance = ref(50)
const chromaKeySmoothness = ref(30)
const edgeSpillSuppression = ref(20)
const spillSuppress = ref(15)
const scenePresets = ref([])
const activePresetIdx = ref(null)

// 可见图层反转（用于预览区从底到顶渲染）
const visibleLayersReversed = computed(() =>
  [...sceneLayers.value].filter(l => l.visible).reverse()
)

// 预览图层尺寸计算
const getPreviewLayerSize = (layer) => {
  const type = layer.typeLabel
  if (type === '摄像机') {
    // 主摄像机占满，副摄像机小窗
    if (layer.id === 1 || layer.opacity === 100) return { w: 90, h: 85, x: 5, y: 7 }
    return { w: 35, h: 30, x: 58, y: 60 }
  }
  if (type === '文字') return { w: 60, h: 10, x: 20, y: 3 }
  if (type === '抓屏') return { w: 40, h: 35, x: 5, y: 58 }
  if (type === '图片') return { w: 25, h: 20, x: 70, y: 5 }
  return { w: 40, h: 30, x: 30, y: 35 }
}

// 图层类型图标
const getLayerTypeIcon = (typeLabel) => {
  const icons = { '摄像机': VideoCamera, '文字': Document, '抓屏': Monitor, '图片': Picture }
  return icons[typeLabel] || Collection
}

// 重命名图层
const startRenameLayer = (idx) => {
  if (sceneLayers.value[idx]?.locked) return
  editingLayerIdx.value = idx
  editingLayerName.value = sceneLayers.value[idx].name
  nextTick(() => {
    const inputs = document.querySelectorAll('.layer-rename-input')
    if (inputs.length > 0) inputs[inputs.length - 1].focus()
  })
}

const saveLayerName = (idx) => {
  if (editingLayerName.value.trim() && idx < sceneLayers.value.length) {
    sceneLayers.value[idx].name = editingLayerName.value.trim()
  }
  editingLayerIdx.value = null
}

// 场景预设管理
const saveScenePreset = () => {
  const name = `场景 ${scenePresets.value.length + 1}`
  scenePresets.value.push({
    name,
    chromaKey: enableChromaKey.value,
    chromaColor: chromaKeyColor.value,
    layers: sceneLayers.value.map(l => ({
      name: l.name, typeLabel: l.typeLabel, tagType: l.tagType,
      color: l.color, opacity: l.opacity, visible: l.visible
    }))
  })
  activePresetIdx.value = scenePresets.value.length - 1
  ElMessage.success(`已保存场景预设「${name}」`)
}

const loadScenePreset = (pIdx) => {
  const preset = scenePresets.value[pIdx]
  if (!preset) return
  sceneLayers.value = preset.layers.map((l, i) => ({
    ...l, id: i + 1, locked: false
  }))
  layerIdCounter = sceneLayers.value.length + 1
  enableChromaKey.value = preset.chromaKey
  chromaKeyColor.value = preset.chromaColor || 'green'
  activePresetIdx.value = pIdx
  selectedLayer.value = null
  ElMessage.success(`已加载场景预设「${preset.name}」`)
}

const deleteScenePreset = (pIdx) => {
  const name = scenePresets.value[pIdx]?.name || ''
  scenePresets.value.splice(pIdx, 1)
  if (activePresetIdx.value === pIdx) activePresetIdx.value = null
  else if (activePresetIdx.value > pIdx) activePresetIdx.value--
  ElMessage.success(`已删除预设「${name}」`)
}

const showShareDialog = ref(false)
const shareLink = ref('')
const currentShareItem = ref(null)

// 实时评论
const commentsList = ref(null)
const newComment = ref('')
const schoolComments = {
  'hailin-second-primary': [
    { user: '乔晶', role: 'teacher', content: '讲解得很清晰！', time: '09:12' },
    { user: '陈秀英', role: 'leader', content: '学生参与度很高', time: '09:15' },
    { user: '宋丽君', role: 'teacher', content: '动作示范很标准', time: '09:18' },
    { user: '赵校长', role: 'principal', content: '互动环节设计得很好', time: '09:22' },
    { user: '于化龙', role: 'teacher', content: '建议多增加一些练习时间', time: '09:25' },
    { user: '宫秋楠', role: 'expert', content: '整体效果不错！', time: '09:28' }
  ],
  'hailin-zirong-primary': [
    { user: '马建华', role: 'teacher', content: '课堂气氛很活跃！', time: '09:12' },
    { user: '赵校长', role: 'principal', content: '教学方法很新颖', time: '09:15' },
    { user: '孙老师', role: 'teacher', content: '学生掌握得很快', time: '09:18' },
    { user: '李老师', role: 'teacher', content: '分组练习效果很好', time: '09:22' },
    { user: '周老师', role: 'expert', content: '训练计划科学合理', time: '09:25' },
    { user: '吴老师', role: 'teacher', content: '安全措施到位', time: '09:28' }
  ],
  'linhai-experimental-primary': [
    { user: '王海燕', role: 'teacher', content: '教学目标明确！', time: '09:12' },
    { user: '林校长', role: 'principal', content: '技术讲解详细', time: '09:15' },
    { user: '刘老师', role: 'teacher', content: '学生进步明显', time: '09:18' },
    { user: '陈老师', role: 'teacher', content: '课堂组织有序', time: '09:22' },
    { user: '杨老师', role: 'expert', content: '技巧训练扎实', time: '09:25' },
    { user: '郭老师', role: 'teacher', content: '课后辅导到位', time: '09:28' }
  ]
}

const getSchoolComments = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolComments[schoolId] || schoolComments['hailin-second-primary']
}

const comments = usePersistedRef(`smart_pe_live_comments_${store.state.school.id || 'hailin-second-primary'}`, getSchoolComments())

const submitComment = () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const userName = store.state.user.name || store.state.user.username || '教师'
  comments.value.push({
    user: userName,
    role: store.state.user.role || 'teacher',
    content: newComment.value.trim(),
    time: timeStr
  })
  newComment.value = ''
  nextTick(() => {
    if (commentsList.value) {
      commentsList.value.scrollTop = commentsList.value.scrollHeight
    }
  })
}

const isCurrentUser = (userName) => {
  const currentName = store.state.user.name || store.state.user.username
  return currentName && userName === currentName
}

const getAvatarStyle = (userName) => {
  const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4', '#10B981', '#F97316']
  let hash = 0
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return { background: colors[index] }
}

const getRoleLabel = (role) => {
  const roleMap = {
    admin: '管理员',
    principal: '校领导',
    leader: '学科组长',
    teacher: '教师',
    expert: '评课专家'
  }
  return roleMap[role] || role
}

const timelineEvents = ref([
  { time: '00:05', type: 'instruction', typeLabel: '指导', content: '教师讲解立定跳远动作要领' },
  { time: '00:12', type: 'question', typeLabel: '提问', content: '询问学生起跳姿势' },
  { time: '00:18', type: 'interaction', typeLabel: '互动', content: '学生分组练习' },
  { time: '00:25', type: 'feedback', typeLabel: '反馈', content: '教师纠正学生动作' },
  { time: '00:32', type: 'instruction', typeLabel: '指导', content: '讲解落地缓冲技巧' },
  { time: '00:40', type: 'interaction', typeLabel: '互动', content: '学生再次练习' },
  { time: '00:48', type: 'feedback', typeLabel: '反馈', content: '表扬进步明显的学生' },
  { time: '00:55', type: 'summary', typeLabel: '总结', content: '总结本节课重点' }
])

const keywordCloud = ref([
  { word: '立定跳远', size: 32, color: '#1E5AA8' },
  { word: '起跳', size: 28, color: '#3B82F6' },
  { word: '落地', size: 24, color: '#F5A623' },
  { word: '动作要领', size: 20, color: '#1E5AA8' },
  { word: '练习', size: 26, color: '#3B82F6' },
  { word: '纠正', size: 18, color: '#E85D4E' },
  { word: '进步', size: 22, color: '#1E5AA8' },
  { word: '技巧', size: 20, color: '#F5A623' },
  { word: '分组', size: 16, color: '#9CA3AF' },
  { word: '缓冲', size: 18, color: '#3B82F6' },
  { word: '姿势', size: 24, color: '#1E5AA8' },
  { word: '重点', size: 20, color: '#F5A623' },
  { word: '指导', size: 22, color: '#3B82F6' },
  { word: '表扬', size: 18, color: '#1E5AA8' },
  { word: '总结', size: 16, color: '#9CA3AF' }
])

// 图表相关
const viewTrendChart = ref(null)
const sourceChart = ref(null)
const emotionChart = ref(null)
let viewTrendChartInstance = null
let sourceChartInstance = null
let emotionChartInstance = null

// Tab切换处理
const handleTabChange = (tabName) => {
  activeTab.value = tabName
  if (tabName === 'stats') {
    nextTick(() => {
      setTimeout(() => {
        initCharts()
      }, 200)
    })
  }
}

const liveForm = ref({
  title: '',
  subject: '',
  teacher: '',
  location: '',
  networkMode: 'multicast',
  maxClients: 254
})

const uploadForm = ref({
  title: '',
  subject: '',
  teacher: ''
})

const compositionForm = ref({
  mainVideo: 'camera1',
  pictureInPicture: 'camera2',
  showScoreOverlay: true,
  showTimerOverlay: true,
  showCoachTips: true,
  scorePosition: 'top-right',
  timerPosition: 'top-left',
  pictureInPicturePosition: 'bottom-right',
  transition: 'fade',
  transitionDuration: 500,
  outputResolution: '1080p',
  frameRate: '30',
  outputFormat: 'mp4'
})

const schoolStats = {
  'hailin-second-primary': {
    liveCount: 3,
    totalViews: 12580,
    videoCount: 156,
    totalDuration: 428,
    maxPeakViewers: 512
  },
  'hailin-zirong-primary': {
    liveCount: 2,
    totalViews: 8340,
    videoCount: 89,
    totalDuration: 265,
    maxPeakViewers: 328
  },
  'linhai-experimental-primary': {
    liveCount: 4,
    totalViews: 15680,
    videoCount: 203,
    totalDuration: 512,
    maxPeakViewers: 645
  }
}

const getSchoolStats = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolStats[schoolId] || schoolStats['hailin-second-primary']
}

const stats = usePersistedRef(`smart_pe_live_stats_${store.state.school.id || 'hailin-second-primary'}`, getSchoolStats())

const progressColor = [
  { color: '#1E5AA8', percentage: 40 },
  { color: '#F5A623', percentage: 70 },
  { color: '#E85D4E', percentage: 100 }
]

const schoolLiveStreams = {
  'hailin-second-primary': [
    { title: '篮球基础训练课程', teacher: '乔晶', subject: '篮球', viewers: 128, peakViewers: 256, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20live%20training%20students%20school%20gymnasium&image_size=landscape_16_9' },
    { title: '足球战术分析', teacher: '宋丽君', subject: '足球', viewers: 86, peakViewers: 189, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20live%20tactics%20analysis%20school%20field&image_size=landscape_16_9' },
    { title: '田径体能训练', teacher: '于化龙', subject: '田径', viewers: 54, peakViewers: 145, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20live%20training%20school%20athletics&image_size=landscape_16_9' }
  ],
  'hailin-zirong-primary': [
    { title: '篮球进阶技巧', teacher: '马建华', subject: '篮球', viewers: 95, peakViewers: 180, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20advanced%20skills%20live%20training&image_size=landscape_16_9' },
    { title: '足球基础训练', teacher: '陈秀英', subject: '足球', viewers: 72, peakViewers: 145, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20basic%20training%20live%20school&image_size=landscape_16_9' },
    { title: '田径短跑训练', teacher: '孙老师', subject: '田径', viewers: 48, peakViewers: 112, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sprint%20training%20live%20track%20field&image_size=landscape_16_9' }
  ],
  'linhai-experimental-primary': [
    { title: '篮球战术配合', teacher: '王海燕', subject: '篮球', viewers: 88, peakViewers: 172, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20team%20tactics%20live%20school&image_size=landscape_16_9' },
    { title: '足球控球训练', teacher: '张志远', subject: '足球', viewers: 65, peakViewers: 130, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20ball%20control%20training%20live&image_size=landscape_16_9' },
    { title: '田径长跑训练', teacher: '刘老师', subject: '田径', viewers: 42, peakViewers: 98, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=long%20distance%20running%20training%20live&image_size=landscape_16_9' },
    { title: '羽毛球技巧提升', teacher: '陈老师', subject: '羽毛球', viewers: 38, peakViewers: 85, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=badminton%20skills%20improvement%20live&image_size=landscape_16_9' }
  ]
}

const getSchoolLiveStreams = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolLiveStreams[schoolId] || schoolLiveStreams['hailin-second-primary']
}

const liveStreams = usePersistedRef(`smart_pe_live_streams_${store.state.school.id || 'hailin-second-primary'}`, getSchoolLiveStreams())

const schoolVideos = {
  'hailin-second-primary': [
    { title: '篮球运球技巧教学', teacher: '乔晶', subject: '篮球', duration: '45:32', views: 3256, date: '2026-01-14', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20dribbling%20technique%20tutorial%20school&image_size=landscape_16_9' },
    { title: '足球传球训练', teacher: '宋丽君', subject: '足球', duration: '38:15', views: 2145, date: '2026-01-13', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20passing%20training%20school%20field&image_size=landscape_16_9' },
    { title: '田径起跑姿势', teacher: '于化龙', subject: '田径', duration: '28:45', views: 1876, date: '2026-01-12', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20starting%20position%20athletics&image_size=landscape_16_9' },
    { title: '羽毛球发球技巧', teacher: '宫秋楠', subject: '羽毛球', duration: '32:18', views: 1543, date: '2026-01-11', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=badminton%20serve%20technique%20training&image_size=landscape_16_9' },
    { title: '体操基础动作', teacher: '高霞', subject: '体操', duration: '42:30', views: 1234, date: '2026-01-10', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gymnastics%20basic%20skills%20school%20gym&image_size=landscape_16_9' },
    { title: '游泳入门教学', teacher: '卢伟珍', subject: '游泳', duration: '52:15', views: 2876, date: '2026-01-09', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=swimming%20beginner%20lesson%20pool%20school&image_size=landscape_16_9' }
  ],
  'hailin-zirong-primary': [
    { title: '篮球攻防技巧', teacher: '马建华', subject: '篮球', duration: '42:18', views: 2156, date: '2026-01-14', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20offense%20defense%20training%20school&image_size=landscape_16_9' },
    { title: '足球基础传球', teacher: '陈秀英', subject: '足球', duration: '35:22', views: 1645, date: '2026-01-13', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20basic%20passing%20school%20field&image_size=landscape_16_9' },
    { title: '田径爆发力训练', teacher: '孙老师', subject: '田径', duration: '30:15', views: 1276, date: '2026-01-12', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=athletics%20explosive%20power%20training&image_size=landscape_16_9' },
    { title: '羽毛球基础步法', teacher: '李老师', subject: '羽毛球', duration: '28:10', views: 943, date: '2026-01-11', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=badminton%20footwork%20basics%20training&image_size=landscape_16_9' },
    { title: '游泳提高技巧', teacher: '周老师', subject: '游泳', duration: '45:20', views: 1876, date: '2026-01-10', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=swimming%20advanced%20skills%20pool&image_size=landscape_16_9' },
    { title: '篮球对抗训练', teacher: '马建华', subject: '篮球', duration: '48:30', views: 2345, date: '2026-01-08', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20scrimmage%20training%20school&image_size=landscape_16_9' }
  ],
  'linhai-experimental-primary': [
    { title: '篮球战术配合教学', teacher: '王海燕', subject: '篮球', duration: '50:15', views: 3856, date: '2026-01-14', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20team%20tactics%20cooperation%20school&image_size=landscape_16_9' },
    { title: '足球控球技巧', teacher: '张志远', subject: '足球', duration: '42:30', views: 2645, date: '2026-01-13', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20ball%20control%20skills%20training&image_size=landscape_16_9' },
    { title: '田径耐力训练', teacher: '刘老师', subject: '田径', duration: '35:45', views: 1976, date: '2026-01-12', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20endurance%20training&image_size=landscape_16_9' },
    { title: '羽毛球技巧提升', teacher: '陈老师', subject: '羽毛球', duration: '38:22', views: 1643, date: '2026-01-11', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=badminton%20skills%20improvement%20training&image_size=landscape_16_9' },
    { title: '体操技巧训练', teacher: '杨老师', subject: '体操', duration: '45:18', views: 1534, date: '2026-01-10', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gymnastics%20skills%20training%20school&image_size=landscape_16_9' },
    { title: '篮球投篮技巧', teacher: '王海燕', subject: '篮球', duration: '42:45', views: 2976, date: '2026-01-08', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20shooting%20technique%20school&image_size=landscape_16_9' }
  ]
}

const getSchoolVideos = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolVideos[schoolId] || schoolVideos['hailin-second-primary']
}

const videos = usePersistedRef(`smart_pe_live_videos_${store.state.school.id || 'hailin-second-primary'}`, getSchoolVideos())

const filteredLiveStreams = computed(() => {
  return (liveStreams.value || []).filter((item) => {
    const matchesQuery = !searchQuery.value || item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesSubject = !filterSubject.value || item.subject === filterSubject.value
    return matchesQuery && matchesSubject
  })
})

const filteredVideos = computed(() => {
  return (videos.value || []).filter((item) => {
    const matchesQuery = !searchQuery.value || item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesSubject = !filterSubject.value || item.subject === filterSubject.value
    return matchesQuery && matchesSubject
  })
})

const refreshData = () => {
  searchQuery.value = ''
  filterSubject.value = ''
  nextTick(() => {
    initEmotionChart()
    initCharts()
  })
  ElMessage.success('数据已刷新')
}

const uploadVideo = () => {
  uploadForm.value = {
    title: '',
    subject: '',
    teacher: ''
  }
  showUploadDialog.value = true
}

const beforeUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    ElMessage.error('请上传视频文件')
    return false
  }
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('视频文件大小不能超过 50MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  const newVideo = {
    id: generateDeterministicId('video', uploadForm.value.title || 'untitled'),
    title: uploadForm.value.title || '未命名视频',
    teacher: uploadForm.value.teacher || '未知教师',
    subject: uploadForm.value.subject || '其他',
    duration: '00:00',
    views: 0,
    date: new Date().toISOString().split('T')[0],
    uploaded: true
  }
  videos.value.unshift(newVideo)
  ElMessage.success('视频上传成功')
}

const confirmUpload = () => {
  if (!uploadForm.value.title) {
    ElMessage.warning('请输入视频标题')
    return
  }
  if (!uploadForm.value.subject) {
    ElMessage.warning('请选择课程类型')
    return
  }
  if (!uploadForm.value.teacher) {
    ElMessage.warning('请输入教师姓名')
    return
  }
  
  const newVideo = {
    id: generateDeterministicId('video', uploadForm.value.title),
    title: uploadForm.value.title,
    teacher: uploadForm.value.teacher,
    subject: uploadForm.value.subject,
    duration: '00:00',
    views: 0,
    date: new Date().toISOString().split('T')[0],
    uploaded: true
  }
  videos.value.unshift(newVideo)
  
  ElMessage.success('视频上传成功')
  showUploadDialog.value = false
  uploadForm.value = {
    title: '',
    subject: '',
    teacher: ''
  }
}

const saveComposition = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  sessionStorage.setItem(`smart_pe_composition_${schoolId}`, JSON.stringify(compositionForm.value))
  ElMessage.success('聚合内容设置已保存')
  showCompositionDialog.value = false
}

const viewLive = (item) => {
  playerTitle.value = `直播中 - ${item.title}`
  playerInfo.value = item
  playerVisible.value = true

  // 初始化NLP分析图表
  nextTick(() => {
    setTimeout(() => {
      initEmotionChart()
    }, 300)
  })
}

const viewPlayback = (item) => {
  playerTitle.value = `回放 - ${item.title}`
  playerInfo.value = item
  playerVisible.value = true

  // 初始化NLP分析图表
  nextTick(() => {
    setTimeout(() => {
      initEmotionChart()
    }, 300)
  })
}

// 初始化情感分析图表
const initEmotionChart = () => {
  if (!emotionChart.value) {
    return
  }

  if (emotionChartInstance) {
    emotionChartInstance.dispose()
  }

  emotionChartInstance = echarts.init(emotionChart.value)

  // 从数据动态计算情感分布
  const totalViewers = (liveStreams.value || []).reduce((s, l) => s + (l.viewers || 0), 0)
  const totalVideoViews = (videos.value || []).reduce((s, v) => s + (v.views || 0), 0)
  const totalContent = (liveStreams.value || []).length + (videos.value || []).length
  const totalEngagement = totalViewers + totalVideoViews

  // 基于互动量和内容数量计算情感分布
  const positiveRate = Math.min(75, Math.max(40, 50 + totalContent * 3 + (totalEngagement > 500 ? 10 : 0)))
  const negativeRate = Math.max(5, Math.min(20, 15 - totalContent * 1))
  const neutralRate = 100 - positiveRate - negativeRate

  emotionChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '情感分析',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: positiveRate, name: '积极', itemStyle: { color: '#1E5AA8' } },
          { value: neutralRate, name: '中性', itemStyle: { color: '#F5A623' } },
          { value: negativeRate, name: '消极', itemStyle: { color: '#E85D4E' } }
        ]
      }
    ]
  })
}

const openShare = (item) => {
  currentShareItem.value = { ...item, type: item.location ? 'live' : 'playback' }
  shareLink.value = `https://sports.example.com/${item.location ? 'live' : 'playback'}/${item.id || 'unknown'}`
  showShareDialog.value = true
}

const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制到剪贴板')
}

// 初始化图表
const initCharts = () => {
  // 确保容器存在且有尺寸
  if (!viewTrendChart.value || !sourceChart.value) {
    return
  }
  
  const viewTrendRect = viewTrendChart.value.getBoundingClientRect()
  const sourceRect = sourceChart.value.getBoundingClientRect()
  
  if (viewTrendRect.width < 100 || viewTrendRect.height < 100) {
    setTimeout(initCharts, 100)
    return
  }

  // 观看趋势图表
  if (viewTrendChartInstance) {
    viewTrendChartInstance.dispose()
  }
  viewTrendChartInstance = echarts.init(viewTrendChart.value)
  viewTrendChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E8EAED',
      borderWidth: 1,
      textStyle: { color: '#1A1A2E', fontSize: 13 },
      padding: [12, 16],
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#1E5AA8', type: 'dashed' },
        crossStyle: { color: '#1E5AA8' }
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    series: [{
      name: '观看人数',
      type: 'line',
      smooth: true,
      data: (() => {
        const base = stats.value.totalViews || 1000
        const dailyBase = Math.round(base / 30)
        const liveCount = (liveStreams.value || []).length
        const videoCount = (videos.value || []).length
        const factors = [0.8, 1.0, 1.2, 1.5, 1.3, 1.8, 2.2]
        const contentScale = 1 + (liveCount + videoCount) * 0.02
        return factors.map(f => Math.round(dailyBase * f * contentScale))
      })(),
      lineStyle: { color: '#1E5AA8', width: 3 },
      itemStyle: { color: '#1E5AA8', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
          { offset: 1, color: 'rgba(30, 90, 168, 0.02)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 8,
      emphasis: {
        focus: 'series',
        itemStyle: {
          color: '#1E5AA8',
          borderWidth: 3,
          borderColor: '#fff',
          shadowColor: 'rgba(30, 90, 168, 0.4)',
          shadowBlur: 10
        }
      },
      animationDuration: 2000,
      animationEasing: 'cubicOut',
      animationDelay: 200
    }]
  })
  
  // 添加点击事件
  viewTrendChartInstance.on('click', function(params) {
    ElMessage.info(`周${params.name}观看人数: ${params.value}人`)
  })

  // 来源分布图表
  if (sourceChartInstance) {
    sourceChartInstance.dispose()
  }
  sourceChartInstance = echarts.init(sourceChart.value)
  sourceChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E8EAED',
      borderWidth: 1,
      textStyle: { color: '#1A1A2E', fontSize: 13 },
      padding: [12, 16],
      formatter: '{b}<br/>占比: {c}% ({d}%)'
    },
    legend: {
      bottom: 10,
      left: 'center',
      textStyle: { color: '#6B7280', fontSize: 12 },
      itemWidth: 16,
      itemHeight: 10,
      itemGap: 20
    },
    series: [{
      name: '观看来源',
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#FFFFFF',
        borderWidth: 3
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 22,
          fontWeight: 'bold',
          formatter: '{b}\n{c}%'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        scale: true,
        scaleSize: 15
      },
      labelLine: {
        show: false
      },
      data: (() => {
        const liveViewers = (liveStreams.value || []).reduce((s, l) => s + (l.viewers || 0), 0)
        const videoViews = (videos.value || []).reduce((s, v) => s + (v.views || 0), 0)
        const total = liveViewers + videoViews || 1
        const schoolRatio = Math.round(30 + (liveViewers / total) * 30)
        const homeRatio = Math.round(20 + (videoViews / total) * 30)
        const mobileRatio = Math.max(5, 100 - schoolRatio - homeRatio)
        return [
          { value: schoolRatio, name: '学校网络', itemStyle: { color: '#1E5AA8' } },
          { value: homeRatio, name: '家庭网络', itemStyle: { color: '#3B82F6' } },
          { value: mobileRatio, name: '移动网络', itemStyle: { color: '#F5A623' } }
        ]
      })(),
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function(idx) {
        return idx * 150
      },
      animationDuration: 1500
    }]
  })
  
  // 添加图例点击事件
  sourceChartInstance.on('legendselectchanged', function(params) {
    const selected = Object.keys(params.selected).filter(k => params.selected[k])
    if (selected.length > 0) {
      ElMessage.info(`已选择: ${selected.join('、')}`)
    }
  })
}

// 图表resize处理
const handleChartResize = () => {
  if (viewTrendChartInstance) {
    viewTrendChartInstance.resize()
  }
  if (sourceChartInstance) {
    sourceChartInstance.resize()
  }
  if (emotionChartInstance) {
    emotionChartInstance.resize()
  }
}

// 数据变化时重新初始化图表
watch([stats, liveStreams, videos], () => {
  nextTick(() => {
    initCharts()
    initEmotionChart()
  })
}, { deep: true })

const extractLiveFrames = async () => {
  const videoUrl = '/示例视频.mp4'
  for (const live of liveStreams.value) {
    if (!live.frame) {
      const frame = await extractVideoFrame(videoUrl, { time: 0.5 })
      if (frame) {
        live.frame = frame
      }
    }
  }
  for (const video of videos.value) {
    if (!video.frame) {
      const frame = await extractVideoFrame(videoUrl, { time: 0.5 })
      if (frame) {
        video.frame = frame
      }
    }
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleChartResize)
  setTimeout(extractLiveFrames, 500)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  
  if (viewTrendChartInstance) {
    viewTrendChartInstance.dispose()
    viewTrendChartInstance = null
  }
  if (sourceChartInstance) {
    sourceChartInstance.dispose()
    sourceChartInstance = null
  }
  if (emotionChartInstance) {
    emotionChartInstance.dispose()
    emotionChartInstance = null
  }
})

const startLive = () => {
  liveForm.value = {
    title: '',
    subject: '',
    teacher: '',
    location: '',
    networkMode: 'multicast',
    maxClients: 254
  }
  showLiveDialog.value = true
}

const confirmStartLive = () => {
  if (!liveForm.value.title) {
    ElMessage.warning('请输入直播标题')
    return
  }
  if (!liveForm.value.subject) {
    ElMessage.warning('请选择课程类型')
    return
  }
  if (!liveForm.value.teacher) {
    ElMessage.warning('请输入教师姓名')
    return
  }
  if (!liveForm.value.location) {
    ElMessage.warning('请输入直播地点')
    return
  }
  liveStreams.value.unshift({
    title: liveForm.value.title,
    teacher: liveForm.value.teacher,
    subject: liveForm.value.subject === 'basketball' ? '篮球' : 
             liveForm.value.subject === 'football' ? '足球' : 
             liveForm.value.subject === 'athletics' ? '田径' : 
             liveForm.value.subject === 'gymnastics' ? '体操' : 
             liveForm.value.subject === 'badminton' ? '羽毛球' : '游泳',
    viewers: 0
  })
  stats.value.liveCount = liveStreams.value.length
  showLiveDialog.value = false
  ElMessage.success('直播已开始！')
}

const recordVideo = () => {
  ElMessage.info('正在开始录制...')
}
</script>

<style scoped>
.live-playback-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.tabs-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;
}

.lesson-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.lesson-card {
  border: 1px solid #E8EAED;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lesson-cover {
  position: relative;
  height: 160px;
  background: #F7F8FA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-text {
  font-size: 13px;
  color: #9CA3AF;
}

.lesson-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.lesson-status-badge.live {
  background: #FEE2E2;
  color: #991B1B;
}

.lesson-status-badge.completed {
  background: #DCFCE7;
  color: #166534;
}

.lesson-status-badge.upcoming {
  background: #DBEAFE;
  color: #1E40AF;
}

.duration-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.lesson-info {
  padding: 16px;
}

.lesson-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  line-height: 20px;
}

.lesson-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6B7280;
}

.lesson-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lesson-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #6B7280;
}

.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #F7F8FA;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.lesson-actions {
  display: flex;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-container {
  height: 240px;
  width: 100%;
}

.mode-tip {
  margin-top: 8px;
}

.concurrent-info {
  width: 100%;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.concurrent-info .concurrent-num {
  font-size: 16px;
  font-weight: 600;
  color: #1E5AA8;
  margin-bottom: 12px;
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.stats-grid .full-width {
  grid-column: 1 / -1;
}

.network-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.mode-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #E8EAED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-option:hover {
  border-color: #1E5AA8;
}

.mode-option.active {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.mode-icon {
  font-size: 32px;
}

.mode-info {
  flex: 1;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.mode-desc {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.concurrent-display {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.concurrent-display .concurrent-num {
  font-size: 48px;
  font-weight: 700;
  color: #1E5AA8;
  line-height: 1;
}

.concurrent-unit {
  font-size: 14px;
  color: #6B7280;
  margin-top: 4px;
}

.concurrent-hint {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 12px;
}

.scene-composition-section {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
}

.composition-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

/* 可视化合成预览 */
.visual-preview {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  overflow: hidden;
  margin-bottom: 12px;
}

.preview-canvas {
  position: relative;
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.preview-bg-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.12);
  font-size: 18px;
  font-weight: 600;
  pointer-events: none;
  letter-spacing: 6px;
  text-transform: uppercase;
}

.preview-layer {
  position: absolute;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.preview-layer-label {
  color: #fff;
  font-size: 11px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  text-align: center;
  padding: 2px 6px;
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
}

.preview-chroma-overlay {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  pointer-events: none;
  font-weight: 500;
}

.preview-chroma-overlay.green {
  background: rgba(34, 197, 94, 0.15);
  border: 2px dashed rgba(34, 197, 94, 0.6);
}

.preview-chroma-overlay.blue {
  background: rgba(59, 130, 246, 0.15);
  border: 2px dashed rgba(59, 130, 246, 0.6);
}

.preview-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: #6B7280;
  background: #FAFBFC;
  border-top: 1px solid #E8EAED;
  flex-wrap: wrap;
}

.chroma-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #F0FDF4;
  color: #16A34A;
  font-size: 11px;
  font-weight: 500;
}

.chroma-badge .chroma-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chroma-badge .chroma-badge-dot.green { background: #22C55E; }
.chroma-badge .chroma-badge-dot.blue { background: #3B82F6; }

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #FEF2F2;
  color: #DC2626;
  font-size: 11px;
  font-weight: 600;
}

.live-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #DC2626;
  animation: livePulse 1.5s ease-in-out infinite;
}

/* 图层列表 */
.layer-list {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  overflow: hidden;
}

.layer-list-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #F7F8FA;
  border-bottom: 1px solid #E8EAED;
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-item:hover {
  background: #FAFBFC;
}

.layer-item.active {
  background: #EEF6FF;
  border-left: 3px solid #1E5AA8;
}

.layer-item.locked {
  opacity: 0.6;
  background: #F9FAFB;
}

.layer-item.locked:hover {
  background: #F9FAFB;
}

.layer-col-order {
  width: 28px;
  text-align: center;
  color: #9CA3AF;
  font-size: 12px;
  flex-shrink: 0;
}

.layer-col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.layer-col-type {
  width: 70px;
  flex-shrink: 0;
}

.layer-col-opacity {
  width: 100px;
  flex-shrink: 0;
}

.layer-col-visible {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.layer-col-lock {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.layer-type-icon {
  font-size: 14px;
  flex-shrink: 0;
  line-height: 1;
}

.layer-rename-input {
  border: 1px solid #1E5AA8;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  width: 140px;
  max-width: 100%;
}

.layer-rename-input:focus {
  box-shadow: 0 0 0 2px rgba(30, 90, 168, 0.2);
}

.layer-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.layer-actions-row {
  display: flex;
  gap: 8px;
}

/* 场景预设 */
.scene-presets {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  padding: 12px;
}

.presets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.presets-title {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #E8EAED;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  background: #F7F8FA;
  border-color: #1E5AA8;
}

.preset-item.active {
  background: #EEF6FF;
  border-color: #1E5AA8;
}

.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.preset-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-meta {
  font-size: 11px;
  color: #9CA3AF;
}

.preset-colors {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.preset-color-chip {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.1);
}

.presets-empty {
  text-align: center;
  padding: 16px;
  color: #9CA3AF;
  font-size: 12px;
}

/* 图层列表表头对齐 */
.layer-list-header .layer-col-order,
.layer-item .layer-col-order { width: 28px; }
.layer-list-header .layer-col-name,
.layer-item .layer-col-name { flex: 1; }
.layer-list-header .layer-col-type,
.layer-item .layer-col-type { width: 70px; }
.layer-list-header .layer-col-opacity,
.layer-item .layer-col-opacity { width: 100px; }
.layer-list-header .layer-col-lock,
.layer-item .layer-col-lock { width: 50px; }
.layer-list-header .layer-col-visible,
.layer-item .layer-col-visible { width: 50px; }

.composition-effect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #E8EAED;
}

.chroma-key-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chroma-options {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chroma-params {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  background: #F7F8FA;
  border-radius: 6px;
}

.chroma-param-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-label {
  font-size: 12px;
  color: #6B7280;
  width: 60px;
  flex-shrink: 0;
  text-align: right;
}

.param-value {
  font-size: 12px;
  color: #1E5AA8;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}

.chroma-preview-dots {
  display: flex;
  gap: 6px;
}

.effect-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.effect-dot.green {
  background: #22C55E;
}

.effect-dot.blue {
  background: #3B82F6;
}

.effect-dot.selected {
  border-color: #1A1A2E;
  transform: scale(1.2);
}

.effect-label {
  font-size: 12px;
  color: #6B7280;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #22C55E;
  font-weight: 500;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.composition-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.full-width {
  grid-column: 1 / -1;
}

/* 分享弹窗样式 */
.share-content {
  display: flex;
  gap: 24px;
}

.share-qrcode {
  flex-shrink: 0;
  text-align: center;
}

.qrcode-placeholder {
  width: 120px;
  height: 120px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.qrcode-svg {
  width: 100px;
  height: 100px;
}

.qrcode-label {
  font-size: 12px;
  color: #6B7280;
}

.share-links {
  flex: 1;
}

.link-item {
  margin-bottom: 16px;
}

.link-item label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 8px;
}

.share-buttons {
  display: flex;
  gap: 8px;
}

/* 三分屏播放器样式 */
.three-screen-player {
  display: flex;
  gap: 12px;
  height: 500px;
  margin-bottom: 16px;
}

.main-screen {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-screens {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.screen-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  padding: 4px 8px;
  background: #F7F8FA;
  border-radius: 4px;
}

.video-container {
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-container.small {
  min-height: 200px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9CA3AF;
  gap: 8px;
}

.player-info {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 24px;
}

.info-item {
  font-size: 14px;
  color: #1A1A2E;
}

/* NLP分析样式 */
.nlp-analysis-section {
  margin-top: 16px;
}

.nlp-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nlp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.nlp-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.nlp-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.nlp-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A2E;
}

.nlp-stat-value.high {
  color: #1E5AA8;
}

.nlp-stat-value.medium {
  color: #F5A623;
}

.nlp-stat-value.low {
  color: #E85D4E;
}

.nlp-timeline h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #FFFFFF;
  border-radius: 6px;
  border-left: 3px solid #E8EAED;
}

.timeline-item:hover {
  background: #F7F8FA;
}

.timeline-time {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
  min-width: 50px;
}

.timeline-content {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.timeline-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.timeline-type.instruction {
  background: #DBEAFE;
  color: #1E40AF;
}

.timeline-type.question {
  background: #FEF3C7;
  color: #92400E;
}

.timeline-type.interaction {
  background: #DCFCE7;
  color: #166534;
}

.timeline-type.feedback {
  background: #FEE2E2;
  color: #991B1B;
}

.timeline-type.summary {
  background: #E0E7FF;
  color: #3730A3;
}

.timeline-text {
  font-size: 14px;
  color: #1A1A2E;
}

/* 关键词云样式 */
.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.keyword-item {
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  padding: 4px 8px;
  border-radius: 4px;
}

.keyword-item:hover {
  transform: scale(1.1);
  background: #F7F8FA;
}

/* 情感分析样式 */
.emotion-analysis {
  display: flex;
  gap: 24px;
  padding: 16px;
}

.emotion-chart {
  flex: 1;
  min-height: 300px;
}

.emotion-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}

.emotion-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.emotion-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

/* 实时评论区样式 */
.live-comments-section {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.comments-count {
  font-size: 13px;
  color: #6B7280;
  background: #F7F8FA;
  padding: 4px 12px;
  border-radius: 12px;
}

.comments-list {
  height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 8px;
}

.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: #F0F2F5;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: #C0C4CC;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.comment-item:hover {
  background: #FAFBFC;
}

.comment-item.is-current-user {
  background: #EEF6FF;
}

.comment-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
  flex-shrink: 0;
}

.comment-role-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.comment-role-tag.admin {
  background: #FEF3C7;
  color: #92400E;
}

.comment-role-tag.principal {
  background: #DBEAFE;
  color: #1E40AF;
}

.comment-role-tag.leader {
  background: #EEF6FF;
  color: #1E5AA8;
}

.comment-role-tag.teacher {
  background: #F3F4F6;
  color: #6B7280;
}

.comment-role-tag.expert {
  background: #FCE7F3;
  color: #9D174D;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.comment-item.is-current-user .comment-user {
  color: #1E5AA8;
}

.comment-time {
  font-size: 12px;
  color: #9CA3AF;
}

.comment-text {
  font-size: 14px;
  color: #4B5563;
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

.comments-input {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.comments-input .el-input {
  flex: 1;
}

/* 跨网段设置 */
.cross-subnet-section {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
}

.cross-subnet-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subnet-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subnet-status {
  font-size: 13px;
  color: #9CA3AF;
}

.subnet-status.on {
  color: #1E5AA8;
  font-weight: 500;
}

.subnet-details {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 8px;
  flex-wrap: wrap;
}

.subnet-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  color: #6B7280;
}

/* 双服务器 */
.dual-server-section {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
}

.dual-server-config {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.server-card {
  flex: 1;
  padding: 14px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 2px solid #E8EAED;
  transition: all 0.3s;
}

.server-card.active {
  border-color: #1E5AA8;
}

.server-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.server-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D1D5DB;
}

.server-dot.online {
  background: #22C55E;
}

.server-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.server-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6B7280;
}

.server-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #1E5AA8;
}

.link-label {
  font-size: 10px;
  color: #6B7280;
}

.dual-server-toggle {
  margin-top: 12px;
}

/* 客户端接收模式 */
.client-mode-section {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
}

.client-mode-info {
  margin-top: 12px;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.mode-badge.passive {
  background: #DBEAFE;
  color: #1E5AA8;
}

.client-mode-info .mode-desc {
  font-size: 12px;
  color: #6B7280;
  margin: 8px 0 16px;
}

.client-stats {
  display: flex;
  gap: 24px;
}

.client-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: #FFFFFF;
  border-radius: 8px;
  flex: 1;
}

.client-stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.client-stat-label {
  font-size: 11px;
  color: #6B7280;
}

/* 合成效果预览弹窗 */
.preview-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-dialog-canvas {
  position: relative;
  width: 100%;
  height: 360px;
  background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
  border-radius: 8px;
  overflow: hidden;
}

.preview-dialog-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.1);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 8px;
  pointer-events: none;
  text-transform: uppercase;
}

.preview-dialog-layer {
  position: absolute;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.preview-dialog-layer-label {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  text-align: center;
  padding: 4px 8px;
  background: rgba(0,0,0,0.25);
  border-radius: 4px;
}

.preview-dialog-chroma {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  pointer-events: none;
  font-weight: 500;
}

.preview-dialog-chroma.green {
  background: rgba(34, 197, 94, 0.15);
  border: 2px dashed rgba(34, 197, 94, 0.6);
}

.preview-dialog-chroma.blue {
  background: rgba(59, 130, 246, 0.15);
  border: 2px dashed rgba(59, 130, 246, 0.6);
}

.preview-dialog-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.preview-dialog-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.preview-dialog-info-row .info-label {
  font-weight: 600;
  color: #6B7280;
  min-width: 80px;
}

.text-green { color: #16A34A; font-weight: 500; }
.text-blue { color: #2563EB; font-weight: 500; }
</style>