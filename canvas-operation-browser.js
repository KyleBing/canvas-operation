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
        this.attaches = attaches                  // Store attaches as class property
        this.hoveredSection = null               // Track which section is being hovered

        // Get device pixel ratio
        this.pixelRatio = window.devicePixelRatio || 1

        // Section dimensions and styling
        this.sectionHeight = 200
        this.sectionWidth = 300
        this.sectionGap = 20
        this.sectionRadius = 10
        this.sectionFillStyle = 'rgba(0, 0, 0, 0.1)'
        this.sectionFont = '30px 微软雅黑, sans-serif'
        this.sectionTextColor = 'black'

        this.bgColor = 'white'

        this.frame = {
            width : 1920 * this.pixelRatio,
            height: 1080 * this.pixelRatio,
        }
        this.center=  {
            x: 600,
            y: 150
        }

        // Add startX and startY as class properties
        this.startX = 0
        this.startY = 0

        this.ctx = null
        this.timeLine = 0
        this.mouseX = 0
        this.mouseY = 0
        this.lastTime = new Date().getTime() // 用于计算每帧用时

        this.init() // 初始化
        this.drawSections(this.ctx, this.attaches)  // 绘制 sections

        // 监听窗口大小变化
        window.onresize = () => {
            this.frame.height = innerHeight * this.pixelRatio
            this.frame.width = innerWidth * this.pixelRatio
            this.updateFrameAttribute(canvasLayer)
            // Recalculate start positions when window is resized
            this.calculateStartPositions()
        }

        document.documentElement.addEventListener('mousemove', event => {
            // Get canvas position
            const canvas = document.getElementById('canvasLayer')
            const rect = canvas.getBoundingClientRect()
            
            // Calculate mouse position relative to canvas
            this.mouseX = (event.clientX - rect.left) * this.pixelRatio
            this.mouseY = (event.clientY - rect.top) * this.pixelRatio

            // Check which section is being hovered
            this.hoveredSection = null
            this.attaches.forEach((attach, index) => {
                const x = this.startX + (index % this.columnCount) * (this.sectionWidth + this.sectionGap)
                const y = this.startY + Math.floor(index / this.columnCount) * (this.sectionHeight + this.sectionGap)
                
                if (this.isPointInSection(this.mouseX, this.mouseY, x, y)) {
                    this.hoveredSection = attach
                }
            })

            // Redraw everything
            this.drawSections(this.ctx, this.attaches)
            
            // If hovering over a section, show its info
            if (this.hoveredSection) {
                // Convert mouse coordinates back to non-pixel-ratio values and adjust for canvas position
                const displayX = event.clientX - rect.left
                const displayY = event.clientY - rect.top
                this.drawInfoPanel(this.hoveredSection.children || [], this.ctx, displayX, displayY)
            }
        })
    }

    // Check if a point is inside a section
    isPointInSection(pointX, pointY, sectionX, sectionY) {
        return pointX >= sectionX && 
               pointX <= sectionX + this.sectionWidth && 
               pointY >= sectionY && 
               pointY <= sectionY + this.sectionHeight
    }

    // 更新画布属性
    updateFrameAttribute(){
        // Get viewport dimensions
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

        // fill background
        this.ctx = canvasLayer.getContext('2d')
        // Scale context to match pixel ratio
        // this.ctx.scale(this.pixelRatio, this.pixelRatio)
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
        ctx.restore()
    }

    // Add method to calculate start positions
    calculateStartPositions() {
        const colCount = this.columnCount
        const rowCount = Math.ceil(this.attaches.length / colCount)
        const totalWidth = colCount * (this.sectionWidth + this.sectionGap) - this.sectionGap
        const totalHeight = rowCount * (this.sectionHeight + this.sectionGap) - this.sectionGap
        
        this.startX = (this.frame.width - totalWidth) / 2
        this.startY = (this.frame.height - totalHeight) / 2
    }

    // 绘制 section
    drawSections(ctx, attaches){
        ctx.clearRect(0, 0, this.frame.width, this.frame.height)
        this.drawBackground(ctx)

        const colCount = this.columnCount
        const rowCount = Math.ceil(attaches.length / colCount)
        
        // Calculate total width and height needed for all sections
        const totalWidth = colCount * (this.sectionWidth + this.sectionGap) - this.sectionGap
        const totalHeight = rowCount * (this.sectionHeight + this.sectionGap) - this.sectionGap
        
        // Calculate starting position to center the sections
        this.calculateStartPositions()

        ctx.save()
        attaches.forEach((attach, index) => {
            const x = this.startX + (index % colCount) * (this.sectionWidth + this.sectionGap)
            const y = this.startY + Math.floor(index / colCount) * (this.sectionHeight + this.sectionGap)
            ctx.beginPath()
            ctx.roundRect(x, y, this.sectionWidth, this.sectionHeight, this.sectionRadius)
            ctx.closePath()
            ctx.fillStyle = this.sectionFillStyle
            ctx.fill()

            ctx.fillStyle = this.sectionTextColor
            ctx.font = this.sectionFont
            ctx.textBaseline = 'top'
            ctx.textAlign = 'left'
            ctx.fillText(attach.name, x + 10, y + 10)
        })
        ctx.restore()
    }


    // 绘制信息面板
    drawInfoPanel(infos, ctx, x, y){
        const offsetX = 30
        const offsetY = 30
        const paddingTB = 10
        const paddingLR = 15
        const fontSize = 22
        const panelWidth = 400
        const lineHeight = 32
        const panelRadius = 10

        // Calculate panel position to ensure it stays within canvas bounds
        let panelX = x
        let panelY = y

        // Adjust panel position if it would go off the right edge
        if (panelX + offsetX + panelWidth > this.frame.width) {
            panelX = x - panelWidth - offsetX
        }

        // Adjust panel position if it would go off the bottom edge
        if (panelY + offsetY + (infos.length * lineHeight + paddingTB * 2) > this.frame.height) {
            panelY = y - (infos.length * lineHeight + paddingTB * 2) - offsetY
        }

        // 绘制面板
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(
            panelX + offsetX + this.startX,
            panelY + offsetY + this.startY,
            panelWidth,
            infos.length * lineHeight + paddingTB * 2,
            panelRadius
        )
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'white'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 5
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 4
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
                panelX + paddingLR + offsetX + this.startX,
                panelY + lineHeight * index + 20 + paddingTB + offsetY + this.startY
            )

            // 价格
            ctx.fillStyle = 'gray'
            ctx.textAlign = 'right'
            ctx.font = `${fontSize}px JetBrains Mono, 微软雅黑, sans-serif`
            ctx.fillText(
                info.price || '',
                panelX + panelWidth - paddingLR + offsetX + this.startX,
                panelY + lineHeight * index + 20 + paddingTB + offsetY + this.startY
            )
        });

        ctx.restore()
    }

    

    // 绘制光标
    drawCursor(ctx, x, y) {
        ctx.clearRect(0, 0, this.frame.width, this.frame.height)
        this.drawBackground(ctx)
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, 20, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.fillStyle = 'black'
        ctx.fill()
        ctx.restore()
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
