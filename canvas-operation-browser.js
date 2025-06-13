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

        this.bgColor = 'white'

        this.frame = {
            width : 1920 * 2,
            height: 1080 * 2,
        }
        this.center=  {
            x: 600,
            y: 150
        }

        this.ctx = null
        this.timeLine = 0
        this.mouseX = 0
        this.mouseY = 0
        this.lastTime = new Date().getTime() // 用于计算每帧用时

        this.init()
        window.onresize = () => {
            this.frame.height = innerHeight * 2
            this.frame.width = innerWidth * 2
            this.updateFrameAttribute(canvasLayer)
        }

        document.documentElement.addEventListener('mousemove', event => {
            this.mouseX = event.x
            this.mouseY = event.y

            this.drawCursor(this.ctx, this.mouseX * 2, this.mouseY * 2)
        })
    }

    updateFrameAttribute(){
        let canvasLayer = document.querySelector('canvas')
        canvasLayer.setAttribute('id', 'canvasLayer')
        canvasLayer.setAttribute('width', this.frame.width)
        canvasLayer.setAttribute('height', this.frame.height)
        canvasLayer.style.width = `${this.frame.width / 2}px`
        canvasLayer.style.height = `${this.frame.height / 2}px`
        canvasLayer.style.zIndex = '-3'
        canvasLayer.style.userSelect = 'none'
        canvasLayer.style.position = 'fixed'
        canvasLayer.style.top = '0'
        canvasLayer.style.left = '0'
        canvasLayer.imageSmoothingEnabled = true

        // fill background
        this.ctx = canvasLayer.getContext('2d')
    }

    init(){
        this.frame.height = document.documentElement.clientHeight * 2
        this.frame.width = document.documentElement.clientWidth * 2

        this.center = {
            x: (this.frame.width - (this.columnOffsetX - 250) * 2 * this.columnCount) / 2, // 300 大约是两个列之间重叠的部分
            y: this.frame.height / 2
        }

        let canvasLayer = document.createElement("canvas")
        document.documentElement.append(canvasLayer)
        this.updateFrameAttribute()
    }

    drawBackground(ctx){
        // 背景
        ctx.save()
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.frame.width, this.frame.height)
        ctx.restore()
    }

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


    animationStart(){
        if (this.isPlaying){

        } else {
            this.isPlaying = true
            this.draw()
        }
    }
    animationStop(){
        this.isPlaying = false
    }

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
