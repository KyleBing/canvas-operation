class CanvasOperation {
    /**
     * CanvasMine
     * @param name {String}主题名
     * @param attaches {[]} 内容
     * @param columnCount {Number} 展示为多少列
     * @param columnOffsetX {Number} 列之间的间隔
     * @param isShowSerialNumber {Boolean} 是否显示序号
     * @param isShowCanvasInfo {Boolean} 是否显示 canvas 信息
     */
    constructor(
        name,
        attaches,
        columnCount,
        columnOffsetX,
        isShowSerialNumber,
        isShowCanvasInfo
    )
    {
        this.isPlaying = true // 默认自动播放
        this.isShowCanvasInfo = isShowCanvasInfo
        this.columnCount = columnCount || 2       // 展示为多少列
        this.columnOffsetX = columnOffsetX || 700 // 列之间的间隔
        this.attaches = attaches                  // 存储内容
        this.hoveredSection = null               // 跟踪当前悬停的部分

        // 获取设备像素比
        this.pixelRatio = window.devicePixelRatio || 1

        // 部分尺寸和样式
        this.sectionHeight = 200
        this.sectionWidth = 300
        this.sectionGap = 20
        this.sectionRadius = 10
        this.sectionFillStyle = 'rgba(0, 0, 0, 0.1)'
        this.sectionFont = '30px 微软雅黑, sans-serif'
        this.sectionTextColor = 'black'

        this.bgColor = 'white'

        // 时间滚动相关属性
        this.currentDate = new Date()
        this.timeScrollHeight = 60 * this.pixelRatio
        this.timeScrollY = 0
        this.verticalTimeScrollWidth = 100 * this.pixelRatio
        this.verticalTimeScrollX = 0

        this.frame = {
            width : 1920 * this.pixelRatio,
            height: 1080 * this.pixelRatio,
        }
        this.center=  {
            x: 600,
            y: 150
        }

        // 添加起始坐标作为类属性
        this.startX = 0
        this.startY = 0

        this.ctx = null
        this.timeLine = 0
        this.mouseX = 0
        this.mouseY = 0
        this.lastTime = new Date().getTime() // 用于计算每帧用时

        this.init() // 初始化
        this.drawSections(this.ctx, this.attaches)  // 绘制部分

        // 监听窗口大小变化
        window.onresize = () => {
            this.frame.height = innerHeight * this.pixelRatio
            this.frame.width = innerWidth * this.pixelRatio
            this.updateFrameAttribute(canvasLayer)
            // 窗口大小改变时重新计算起始位置
            this.calculateStartPositions()
        }

        // 监听鼠标滚轮事件
        document.addEventListener('wheel', (event) => {
            event.preventDefault()
            
            // 根据滚轮方向调整日期
            const deltaY = event.deltaY
            const dayChange = Math.sign(deltaY) // 1 或 -1
            
            this.currentDate.setDate(this.currentDate.getDate() + dayChange)
            
            // 重绘画布
            this.drawSections(this.ctx, this.attaches)
        }, { passive: false })

        // 监听鼠标点击事件
        document.addEventListener('click', (event) => {
            const canvas = document.getElementById('canvasLayer')
            const rect = canvas.getBoundingClientRect()
            
            const clickX = (event.clientX - rect.left) * this.pixelRatio
            const clickY = (event.clientY - rect.top) * this.pixelRatio
            
            // 检查是否点击在垂直时间滚动条内
            this.handleVerticalTimeScrollClick(clickX, clickY)
        })

        document.documentElement.addEventListener('mousemove', event => {
            // 获取画布位置
            const canvas = document.getElementById('canvasLayer')
            const rect = canvas.getBoundingClientRect()
            
            // 计算鼠标相对于画布的位置
            this.mouseX = (event.clientX - rect.left) * this.pixelRatio
            this.mouseY = (event.clientY - rect.top) * this.pixelRatio

            // 检查哪个部分被悬停
            this.hoveredSection = null
            this.attaches.forEach((attach, index) => {
                const x = this.startX + (index % this.columnCount) * (this.sectionWidth + this.sectionGap)
                const y = this.startY + Math.floor(index / this.columnCount) * (this.sectionHeight + this.sectionGap)
                
                if (this.isPointInSection(this.mouseX, this.mouseY, x, y)) {
                    this.hoveredSection = attach
                }
            })

            // 重绘所有内容
            this.drawSections(this.ctx, this.attaches)
            
            // 如果悬停在某个部分上，显示其信息
            if (this.hoveredSection) {
                // 将鼠标坐标转换回非像素比的值并调整画布位置
                const displayX = event.clientX
                const displayY = event.clientY
                this.drawInfoPanel(this.hoveredSection.children || [], this.ctx, displayX * this.pixelRatio, displayY * this.pixelRatio)
            }
        })
    }

    // 检查点是否在部分内
    isPointInSection(pointX, pointY, sectionX, sectionY) {
        return pointX >= sectionX && 
               pointX <= sectionX + this.sectionWidth && 
               pointY >= sectionY && 
               pointY <= sectionY + this.sectionHeight
    }

    // 更新画布属性
    updateFrameAttribute(){
        // 获取视口尺寸
        this.frame.height = window.innerHeight * this.pixelRatio
        this.frame.width = window.innerWidth * this.pixelRatio
        
        let canvasLayer = document.querySelector('canvas')
        canvasLayer.setAttribute('id', 'canvasLayer')
        canvasLayer.setAttribute('width', this.frame.width)
        canvasLayer.setAttribute('height', this.frame.height)
        canvasLayer.style.width = `${this.frame.width / this.pixelRatio}px`
        canvasLayer.style.height = `${this.frame.height / this.pixelRatio}px`
        canvasLayer.style.zIndex = '-3'
        canvasLayer.style.userSelect = 'none'
        canvasLayer.style.position = 'fixed'
        canvasLayer.style.top = '0'
        canvasLayer.style.left = '0'
        canvasLayer.imageSmoothingEnabled = true

        // 填充背景
        this.ctx = canvasLayer.getContext('2d')
    }

    // 初始化
    init(){
        this.center = {
            x: (this.frame.width - (this.columnOffsetX - 250) * 2 * this.columnCount) / 2, // 300 大约是两个列之间重叠的部分
            y: this.frame.height / 2
        }

        let canvasLayer = document.createElement("canvas")
        document.documentElement.append(canvasLayer)
        this.updateFrameAttribute()
    }

    // 绘制背景
    drawBackground(ctx){
        // 背景
        ctx.save()
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.frame.width, this.frame.height)
        
        // 绘制坐标轴和网格
        // this.drawCoordinateAxes(ctx)
        
        // 绘制水平时间滚动条
        this.drawTimeScroll(ctx)
        
        // 绘制垂直时间滚动条
        this.drawVerticalTimeScroll(ctx)
        
        ctx.restore()
    }

    // 绘制坐标轴和网格
    drawCoordinateAxes(ctx) {
        const gridSize = 100 * this.pixelRatio
        const axisColor = 'rgba(0, 0, 0, 0.2)'
        const gridColor = 'rgba(0, 0, 0, 0.1)'
        
        ctx.save()
        
        // 绘制垂直网格线
        for (let x = 0; x < this.frame.width; x += gridSize) {
            ctx.beginPath()
            ctx.strokeStyle = gridColor
            ctx.lineWidth = 1
            ctx.moveTo(x, 0)
            ctx.lineTo(x, this.frame.height)
            ctx.stroke()
        }
        
        // 绘制水平网格线
        for (let y = 0; y < this.frame.height; y += gridSize) {
            ctx.beginPath()
            ctx.strokeStyle = gridColor
            ctx.lineWidth = 1
            ctx.moveTo(0, y)
            ctx.lineTo(this.frame.width, y)
            ctx.stroke()
        }
        
        // 绘制X轴
        ctx.beginPath()
        ctx.strokeStyle = axisColor
        ctx.lineWidth = 2
        ctx.moveTo(0, 0)
        ctx.lineTo(this.frame.width, 0)
        ctx.stroke()
        
        // 绘制Y轴
        ctx.beginPath()
        ctx.strokeStyle = axisColor
        ctx.lineWidth = 2
        ctx.moveTo(0, 0)
        ctx.lineTo(0, this.frame.height)
        ctx.stroke()
        
        // 绘制坐标标签
        ctx.fillStyle = 'black'
        ctx.font = `${16 * this.pixelRatio}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // X轴标签
        for (let x = 0; x < this.frame.width; x += gridSize) {
            const label = Math.round(x / this.pixelRatio)
            ctx.fillText(label.toString(), x, 20 * this.pixelRatio)
        }
        
        // Y轴标签
        for (let y = 0; y < this.frame.height; y += gridSize) {
            const label = Math.round(y / this.pixelRatio)
            ctx.fillText(label.toString(), 20 * this.pixelRatio, y)
        }
        
        ctx.restore()
    }

    // 绘制部分
    drawSections(ctx, attaches){
        ctx.clearRect(0, 0, this.frame.width, this.frame.height)
        this.drawBackground(ctx)

        const colCount = this.columnCount
        const rowCount = Math.ceil(attaches.length / colCount)
        
        // 计算所有部分所需的总宽度和高度
        const totalWidth = colCount * (this.sectionWidth + this.sectionGap) - this.sectionGap
        const totalHeight = rowCount * (this.sectionHeight + this.sectionGap) - this.sectionGap
        
        // 计算起始位置以居中部分
        this.calculateStartPositions()

        ctx.save()
        attaches.forEach((attach, index) => {
            const x = this.startX + (index % colCount) * (this.sectionWidth + this.sectionGap)
            const y = this.startY + Math.floor(index / colCount) * (this.sectionHeight + this.sectionGap)
            ctx.beginPath()
            ctx.roundRect(x, y, this.sectionWidth, this.sectionHeight, this.sectionRadius)
            ctx.closePath()
            
            // 根据是否悬停设置填充颜色
            ctx.fillStyle = this.hoveredSection === attach ? 'rgba(0, 255, 0, 0.2)' : this.sectionFillStyle
            ctx.fill()
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
            ctx.stroke()

            // 绘制标题
            ctx.fillStyle = this.sectionTextColor
            ctx.font = this.sectionFont
            ctx.textBaseline = 'top'
            ctx.textAlign = 'left'
            ctx.fillText(attach.name, x + 20, y + 20)

            // 计算总价和项目数量
            const totalPrice = attach.children ? attach.children.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) : 0
            const itemCount = attach.children ? attach.children.length : 0

            // 绘制总价和数量信息
            ctx.font = '18px JetBrains Mono, 微软雅黑, sans-serif'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'bottom'
            const priceText = `¥${totalPrice.toFixed(2)}`
            const countText = `${itemCount}件`
            const padding = 10

            
            // 绘制数量
            ctx.fillStyle = 'gray'
            ctx.fillText(countText, x + padding, y + this.sectionHeight - padding)

            // 绘制总价
            ctx.fillStyle = 'black'
            ctx.fillText(priceText, x + padding + ctx.measureText(countText).width + 20, y + this.sectionHeight - padding)

        })
        ctx.restore()
    }

    // 绘制信息面板
    drawInfoPanel(infos, ctx, x, y){
        const offsetX = 30      // 偏移量
        const offsetY = 30      // 偏移量
        const paddingTB = 10    // 上下间距
        const paddingLR = 15    // 左右间距
        const fontSize = 22     // 字体大小
        const panelWidth = 400  // 面板宽度
        const lineHeight = 32   // 行高
        const panelRadius = 10  // 圆角

        // 计算面板位置以确保在画布范围内
        let panelX = x
        let panelY = y

        // 如果面板会超出右边缘，调整位置
        if (panelX + offsetX + panelWidth > this.frame.width) {
            panelX = x - panelWidth - offsetX
        }

        // 如果面板会超出底部边缘，调整位置
        if (panelY + offsetY + (infos.length * lineHeight + paddingTB * 2) > this.frame.height) {
            panelY = y - (panelY + offsetY + (infos.length * lineHeight + paddingTB * 2) - this.frame.height)  
        }

        // 绘制面板
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(
            panelX + offsetX,
            panelY + offsetY,
            panelWidth,
            infos.length * lineHeight + paddingTB * 2,
            panelRadius
        )
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillStyle = 'white'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 10
        ctx.shadowOffsetY = 13
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        ctx.restore()

        ctx.save()
        // 绘制内容
        infos.forEach((info, index) => {
            ctx.textAlign = 'left'
            ctx.fillStyle = 'black'
            ctx.font = `${fontSize}px Galvji, 微软雅黑, sans-serif`

            // 名称
            ctx.fillText(
                info.name,
                panelX + paddingLR + offsetX,
                panelY + lineHeight * index + 20 + paddingTB + offsetY
            )

            // 价格
            ctx.fillStyle = 'gray'
            ctx.textAlign = 'right'
            ctx.font = `${fontSize}px JetBrains Mono, 微软雅黑, sans-serif`
            ctx.fillText(
                info.price || '-',
                panelX + panelWidth - paddingLR + offsetX,
                panelY + lineHeight * index + 20 + paddingTB + offsetY
            )
        });

        ctx.restore()
    }

    // 绘制时间滚动条
    drawTimeScroll(ctx) {
        const scrollHeight = this.timeScrollHeight
        const scrollY = this.timeScrollY
        const padding = 20 * this.pixelRatio
        
        ctx.save()
        
        // 绘制时间滚动条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(0, scrollY, this.frame.width, scrollHeight)
        
        // 绘制时间滚动条边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.lineWidth = 1
        ctx.strokeRect(0, scrollY, this.frame.width, scrollHeight)
        
        // 绘制日期列表
        this.drawDayList(ctx, scrollY, scrollHeight, padding)
        
        // 绘制滚轮提示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.font = `${14 * this.pixelRatio}px 微软雅黑, sans-serif`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'
        ctx.fillText('滚轮切换日期', this.frame.width - padding, scrollY + scrollHeight - 5 * this.pixelRatio)
        
        ctx.restore()
    }
    
    // 绘制日期列表
    drawDayList(ctx, scrollY, scrollHeight, padding) {
        const dayWidth = 80 * this.pixelRatio
        const dayHeight = scrollHeight - 10 * this.pixelRatio
        const dayGap = 5 * this.pixelRatio
        const startX = padding + this.verticalTimeScrollWidth
        const startY = scrollY + 5 * this.pixelRatio
        
        // 计算显示多少天（当前日期前后各几天）
        const availableWidth = this.frame.width - padding * 2 - this.verticalTimeScrollWidth
        const totalDays = Math.floor(availableWidth / (dayWidth + dayGap))
        const centerIndex = Math.floor(totalDays / 2)
        
        for (let i = 0; i < totalDays; i++) {
            const dayOffset = i - centerIndex
            const displayDate = new Date(this.currentDate)
            displayDate.setDate(displayDate.getDate() + dayOffset)
            
            const x = startX + i * (dayWidth + dayGap)
            const y = startY
            
            // 判断是否为当前选中日期
            const isCurrentDay = dayOffset === 0
            // 判断是否为周末
            const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6
            
            ctx.save()
            
            // 绘制日期背景
            ctx.beginPath()
            ctx.roundRect(x, y, dayWidth, dayHeight, 8 * this.pixelRatio)
            ctx.closePath()
            
            if (isCurrentDay) {
                ctx.fillStyle = 'rgba(0, 120, 255, 0.2)'
                ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)'
                ctx.lineWidth = 2
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
                ctx.lineWidth = 1
            }
            
            ctx.fill()
            ctx.stroke()
            
            // 绘制日期文本
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            
            // 月份
            const monthText = `${displayDate.getMonth() + 1}月`
            ctx.font = `${10 * this.pixelRatio}px 微软雅黑, sans-serif`
            if (isWeekend) {
                ctx.fillStyle = isCurrentDay ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 0, 0, 0.7)'
            } else {
                ctx.fillStyle = isCurrentDay ? 'rgba(0, 120, 255, 0.7)' : 'gray'
            }
            ctx.fillText(monthText, x + dayWidth / 2, y + 5 * this.pixelRatio)
            
            // 日期数字
            const dayNum = displayDate.getDate()
            if (isWeekend) {
                ctx.font = `bold ${18 * this.pixelRatio}px 微软雅黑, sans-serif`
                ctx.fillStyle = isCurrentDay ? 'rgba(255, 0, 0, 0.8)' : 'red'
            } else {
                ctx.font = `${16 * this.pixelRatio}px 微软雅黑, sans-serif`
                ctx.fillStyle = isCurrentDay ? 'rgba(0, 120, 255, 1)' : 'black'
            }
            
            ctx.fillText(dayNum.toString(), x + dayWidth / 2, y + 18 * this.pixelRatio)
            
            // 星期文本
            const weekText = this.getShortWeekText(displayDate)
            ctx.font = `${12 * this.pixelRatio}px 微软雅黑, sans-serif`
            if (isWeekend) {
                ctx.fillStyle = isCurrentDay ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 0, 0, 0.8)'
            } else {
                ctx.fillStyle = isCurrentDay ? 'rgba(0, 120, 255, 0.8)' : 'gray'
            }
            
            ctx.fillText(weekText, x + dayWidth / 2, y + dayHeight - 15 * this.pixelRatio)
            
            ctx.restore()
        }
    }
    
    // 获取简短星期文本
    getShortWeekText(date) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        return weekdays[date.getDay()]
    }

    // 计算起始位置
    calculateStartPositions() {
        const colCount = this.columnCount
        const rowCount = Math.ceil(this.attaches.length / colCount)
        const totalWidth = colCount * (this.sectionWidth + this.sectionGap) - this.sectionGap
        const totalHeight = rowCount * (this.sectionHeight + this.sectionGap) - this.sectionGap
        
        // 调整X位置以避开垂直时间滚动条
        this.startX = ((this.frame.width - this.verticalTimeScrollWidth - totalWidth) / 2) + this.verticalTimeScrollWidth
        // 调整Y位置以避开水平时间滚动条
        this.startY = ((this.frame.height - this.timeScrollHeight - totalHeight) * 1 / 3) + this.timeScrollHeight
    }

    // 动画开始
    animationStart(){
        if (this.isPlaying){

        } else {
            this.isPlaying = true
            this.draw()
        }
    }

    // 动画停止
    animationStop(){
        this.isPlaying = false
    }

    // 动画销毁
    destroy(){
        this.isPlaying = false
        let canvasLayer = document.getElementById('canvasLayer')
        canvasLayer.remove()
        console.log('动画已停止')
    }

    // 绘制垂直时间滚动条
    drawVerticalTimeScroll(ctx) {
        const scrollWidth = this.verticalTimeScrollWidth
        const scrollX = this.verticalTimeScrollX
        const padding = 10 * this.pixelRatio
        
        ctx.save()
        
        // 绘制垂直时间滚动条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(scrollX, 0, scrollWidth, this.frame.height)
        
        // 绘制垂直时间滚动条边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.lineWidth = 1
        ctx.strokeRect(scrollX, 0, scrollWidth, this.frame.height)
        
        // 绘制垂直日期列表
        this.drawVerticalDayList(ctx, scrollX, scrollWidth, padding)
        
        ctx.restore()
    }
    
    // 处理垂直时间滚动条点击
    handleVerticalTimeScrollClick(clickX, clickY) {
        const scrollWidth = this.verticalTimeScrollWidth
        const scrollX = this.verticalTimeScrollX
        const padding = 10 * this.pixelRatio
        
        // 检查是否在垂直滚动条范围内
        if (clickX >= scrollX && clickX <= scrollX + scrollWidth) {
            const dayHeight = 40 * this.pixelRatio
            const dayGap = 2 * this.pixelRatio
            const startY = this.timeScrollHeight + padding
            
            // 计算显示多少天
            const totalDays = Math.floor((this.frame.height - this.timeScrollHeight - padding * 2) / (dayHeight + dayGap))
            const centerIndex = Math.floor(totalDays / 2)
            
            // 检查点击了哪一天
            for (let i = 0; i < totalDays; i++) {
                const y = startY + i * (dayHeight + dayGap)
                
                if (clickY >= y && clickY <= y + dayHeight) {
                    const dayOffset = i - centerIndex
                    const newDate = new Date(this.currentDate)
                    newDate.setDate(newDate.getDate() + dayOffset)
                    this.currentDate = newDate
                    
                    // 重绘画布
                    this.drawSections(this.ctx, this.attaches)
                    break
                }
            }
        }
    }

    // 绘制垂直日期列表
    drawVerticalDayList(ctx, scrollX, scrollWidth, padding) {
        const dayHeight = 40 * this.pixelRatio
        const dayGap = 2 * this.pixelRatio
        const dayWidth = scrollWidth - padding * 2
        const startX = scrollX + padding
        const startY = this.timeScrollHeight + padding
        
        // 计算显示多少天
        const totalDays = Math.floor((this.frame.height - this.timeScrollHeight - padding * 2) / (dayHeight + dayGap))
        const centerIndex = Math.floor(totalDays / 2)
        
        for (let i = 0; i < totalDays; i++) {
            const dayOffset = i - centerIndex
            const displayDate = new Date(this.currentDate)
            displayDate.setDate(displayDate.getDate() + dayOffset)
            
            const x = startX
            const y = startY + i * (dayHeight + dayGap)
            
            // 判断是否为当前选中日期
            const isCurrentDay = dayOffset === 0
            // 判断是否为周末
            const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6
            
            ctx.save()
            
            // 绘制日期背景
            ctx.beginPath()
            ctx.roundRect(x, y, dayWidth, dayHeight, 4 * this.pixelRatio)
            ctx.closePath()
            
            if (isCurrentDay) {
                ctx.fillStyle = 'rgba(0, 120, 255, 0.2)'
                ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)'
                ctx.lineWidth = 2
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
                ctx.lineWidth = 1
            }
            
            ctx.fill()
            ctx.stroke()
            
            // 在一行中显示所有信息：月/日 星期
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            
            // 月份和日期
            const monthDay = `${displayDate.getMonth() + 1}/${displayDate.getDate()}`
            const weekText = this.getShortWeekText(displayDate)
            const fullText = `${monthDay} ${weekText}`
            
            if (isWeekend) {
                ctx.font = `bold ${12 * this.pixelRatio}px 微软雅黑, sans-serif`
                ctx.fillStyle = isCurrentDay ? 'rgba(255, 0, 0, 0.8)' : 'red'
            } else {
                ctx.font = `${11 * this.pixelRatio}px 微软雅黑, sans-serif`
                ctx.fillStyle = isCurrentDay ? 'rgba(0, 120, 255, 1)' : 'black'
            }
            
            ctx.fillText(fullText, x + dayWidth / 2, y + dayHeight / 2)
            
            ctx.restore()
        }
    }
}

/**
 * ## 显示时间标线序号
 * @param ctx
 * @param timeline {''}
 * @param frame {{width, height}}
 */
function showCanvasInfo(ctx, timeline, frame){
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.font = '20px sans-serf'
    ctx.fillRect(10, frame.height - 53, 220, 30)
    let currentTime =  new Date().getTime()
    ctx.fillStyle = 'black'
    ctx.fillText(`${currentTime - this.lastTime} ms/frame  |  ${timeline} 帧`, 20, frame.height - 32)
    this.lastTime = currentTime
    ctx.restore()
}

/**
 *
 * @param ctx
 * @param center
 * @param radius {Number}
 * @param color {String}
 */

/**
 * ## 画点
 * @param ctx
 * @param center {{x: Number,y: Number}}
 * @param radius  {Number}
 * @param lineWidth {Number}
 * @param fillColor  {String}
 * @param strokeColor {String}
 */
function drawDot(ctx, center, radius, lineWidth, fillColor, strokeColor){
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(center.x + radius, center.y)
    ctx.lineWidth = lineWidth || 0
    ctx.strokeStyle = fillColor || 'black'
    ctx.fillStyle =  strokeColor || 'white'
    ctx.arc(center.x, center.y, radius,0, Math.PI * 2 )
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
}

/**
 * ## 获取第 index 个元素的 y 位置
 * @param middleLineY {{x: Number, y: Number}} 中心线的 y 位置
 * @param itemSize {Number}元素数量
 * @param gap {Number} 每个元素之间的间隔
 * @param index {Number} 第几个元素的位置
 */
function getYPositionOf(middleLineY, itemSize, gap, index){
    let gapCount = itemSize - 1 // gap 总数量
    let middleIndex = gapCount / 2
    if (index >= middleIndex){
        return middleLineY + (index - middleIndex) * gap
    } else {
        return middleLineY - (middleIndex - index) * gap
    }
}

/**
 * ## 在 a 与 d 点之间线一条带圆角的拆线
 * @param ctx canvas.context
 * @param pointA {{x: Number, y: Number}} 起点坐标
 * @param pointD {{x: Number, y: Number}} 末端坐标
 * @param radius  { Number } 圆角半径
 * @param endLineLength  { Number } 末端线段长度
 * @param lineWidth { Number } 线段宽度
 * @param lineColor  { String } 线段颜色
 */
function drawArcLine(ctx, pointA, pointD, radius,  endLineLength, lineWidth, lineColor){
    ctx.save()
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.lineJoin = 'round'
    ctx.moveTo(pointA.x, pointA.y)
    let foldX = pointA.x + (pointD.x - pointA.x - endLineLength)
    ctx.arcTo(
        foldX,
        pointA.y,
        foldX,
        pointD.y,
        radius
    )
    ctx.arcTo(
        foldX,
        pointD.y,
        pointD.x,
        pointD.y,
        radius
    )
    ctx.lineTo(pointD.x, pointD.y)
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.stroke()
    ctx.restore()
    return foldX
}


function getColor(timeLine){
    return `hsla(${timeLine%360 + 200},150%,50%,1)`
}

/**
 * 输出随机 1 或 -1
 * @returns {number}
 */
function randomDirection(){
    let random = Math.random()
    if (random > 0.5){
        return 1
    } else {
        return -1
    }
}

function randomPosition(width, height){
    return [
        Number((width * Math.random()).toFixed(0)),
        Number((height * Math.random()).toFixed(0))
    ]
}

/**
 * 数组乱序算法
 * @param arr
 * @return {*}
 */
function shuffle(arr) {
    let length = arr.length,
        r = length,
        rand = 0;

    while (r) {
        rand = Math.floor(Math.random() * r--);
        [arr[r], arr[rand]] = [arr[rand], arr[r]];
    }
    return arr;
}

/**
 * 生成随机整数
 * @param min
 * @param max
 * @returns {number}
 */
function randomInt(min, max){
    return Number((Math.random() * (max - min) + min).toFixed(0))
}

/**
 * 生成随机整数
 * @param min
 * @param max
 * @returns {number}
 */
function randomFloat(min, max){
    return Number(Math.random() * (max - min) + min)
}
