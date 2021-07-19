
let clickbreak = {}
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // //console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }

        sqrDis() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return (hypotenuse)
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        hypotenuse() {
            //console.log(this)
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.strokeColor
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                //console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#00dd00") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 14)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
            // console.log(keysPressed)
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });

        window.addEventListener('contextmenu', e => {
            e.preventDefault();
            let TIP_enginer = {}
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_enginer.x = XS_engine
            TIP_enginer.y = YS_engine
            TIP_enginer.body = TIP_enginer

            if (players[0].selected.length > 0) {
                for (let t = 0; t < players[0].selected.length; t++) {
                    players[0].selected[t].target = TIP_enginer
                    players[0].selected[t].pather.target = TIP_enginer
                    players[0].selected[t].pather.path()
                    players[0].selected[t].step = 0
                }
            }
            return false
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            selector.x = TIP_engine.x
            selector.y = TIP_engine.y
            // players[0].selected = []
            if(!keysPressed['Shift'] && !keysPressed['Control']){
                selectionbreakstart()
            }
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
            for (let t = 0; t < players[0].army.length; t++) {
                if (selector.doesPerimeterTouch(players[0].army[t].body)) {
                if( !players[0].selected.includes(players[0].army[t])){
                    players[0].selected.push(players[0].army[t])
                    players[0].army[t].body.strokeColor = "black"
                }
                }
            }
            seldraw = 0
            // console.log(players[0])
        })

        function continued_stimuli(e) {
            selectionbreakstop()
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            selector.width = TIP_engine.x - selector.x
            selector.height = TIP_engine.y - selector.y
            seldraw = 1

        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        //console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[2] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed * gamepadAPI.axesStatus[0]
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }


    class Mob {
        constructor(x, y, player) {
            this.body = new Circle(x + (Math.random()), y + (Math.random()), 5, player.color)
            this.moveto = {}
            this.target = {}
            this.range = 25
            this.player = player
            this.health = 400
            this.maxhealth = this.health
            this.melee = 1
            this.goldvalue = 20
            this.movespeed = 2
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")
            this.command = 0

            for (let t = 0; t < players.length; t++) {
                if (players[t] == this.player) {
                    this.target = players[t].base
                }
            }

            this.pather = new Psychopather(this.body)
            this.step = 0
            this.pather.target = this.target
            this.pather.path()
        }
        aggro() {
            if (typeof this.target.body == "undefined") {

                for (let t = 0; t < players.length; t++) {
                    if (players[t] != this.player) {
                        for (let k = 0; k < players[t].army.length; k++) {
                            this.target = players[t].army[k]
                            this.pather.target = this.target
                            this.pather.path()
                            this.step = 0
                        }
                    }
                }

            }


            let wet = 1

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    if (players[t].army.includes(this.target)) {
                        this.wet = 0
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        //console.log(this.target)
                        let link = new LineOP(this.body, players[t].army[k].body)
                        let link2 = {}

                        // if (typeof this.target.body == "undefined") {
                        //      link2 = new LineOP(this.target, this.body)
                        // } else {
                        link2 = new LineOP(this.target.body, this.body)
                        // }
                        if (link.hypotenuse() < link2.hypotenuse() || this.target.health <= 0) {
                            this.target = players[t].army[k]
                            this.pather.target = this.target
                            this.pather.path()
                            this.step = 0
                        }
                    }
                }
            }
        }
        move() {
            let link = new LineOP(this.target.body, this.body)
            if (link.hypotenuse() < (this.range + this.target.body.radius) + (this.body.radius) && this.target.tower == 1) {
                let dummy = this.target.health
                this.target.health -= this.melee

                if (this.target.health > 0) {
                    let link = new LineOP(this.body, this.target.body, this.body.color, 2)
                    link.draw()
                }
                if (dummy > this.target.health) {
                    if (this.target.activeshield > 0) {
                        if (this.target.activeshield >= dummy - this.target.health) {
                            this.target.activeshield -= dummy - this.target.health
                            this.target.health = dummy
                        } else {
                            this.target.health += this.target.activeshield
                            this.target.activeshield = 0
                        }
                    }
                }
                if (this.speedbonus > 0) {
                    this.speedbonus *= .5
                }

            } else if (link.hypotenuse() > this.range) {
                // let xvec = (this.target.body.x - this.body.x)
                // let yvec = (this.target.body.y - this.body.y)
                for(let t = 0;t<20;t++){
                    if(this.pather.waypoints[this.step].doesPerimeterTouch(this.body)){
                        this.step++
                        if(this.step >= this.pather.waypoints.length-1){
                            this.step--
                        }
                    }
                }

                let xvec = (this.pather.waypoints[this.step].x - this.body.x)
                let yvec = (this.pather.waypoints[this.step].y - this.body.y)
                let k = 0
                while (Math.abs(xvec) + Math.abs(yvec) > this.movespeed) {
                    xvec *= .99
                    yvec *= .99
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                while (Math.abs(xvec) + Math.abs(yvec) < this.movespeed) {
                    xvec *= 1.05
                    yvec *= 1.05
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                this.body.x += xvec
                this.body.y += yvec
            } else if (link.hypotenuse() < (this.range + (this.body.radius * 2))) {
                let dummy = this.target.health
                this.target.health -= this.melee

                if (this.target.health > 0) {
                    let link = new LineOP(this.body, this.target.body, this.body.color, 2)
                    link.draw()
                }



                if (dummy > this.target.health) {
                    if (this.target.activeshield > 0) {
                        if (this.target.activeshield >= dummy - this.target.health) {
                            this.target.activeshield -= dummy - this.target.health
                            this.target.health = dummy
                        } else {
                            this.target.health += this.target.activeshield
                            this.target.activeshield = 0
                        }
                    }
                }
                if (this.speedbonus > 0) {
                    this.speedbonus *= .5
                }
            }
        }
        repel() {

            for (let t = 0; t < players.length; t++) {
                for (let k = 0; k < players[t].army.length; k++) {
                    if (players[t].army[k] != this) {
                        if (players[t].army[k].body.doesPerimeterTouch(this.body)) {
                            const distance = ((new LineOP(this.body, players[t].army[k].body)).hypotenuse()) - (players[t].army[k].body.radius + this.body.radius)
                            const angleRadians = Math.atan2(players[t].army[k].body.y - this.body.y, players[t].army[k].body.x - this.body.x);
                            if (this.tower != 1) {
                                this.body.x += (Math.cos(angleRadians) * distance) / 2
                                this.body.y += (Math.sin(angleRadians) * distance) / 2
                            }
                            if (players[t].army[k].tower != 1) {
                                if (players[t].locked <= 0) {
                                    players[t].army[k].body.x -= (Math.cos(angleRadians) * distance) / 2
                                    players[t].army[k].body.y -= (Math.sin(angleRadians) * distance) / 2
                                }
                            }
                        }
                    }
                }
            }
        }
        draw() {
            if (keysPressed['a'] || this.command == 1) {
                this.aggro()
            } else {
                if (this.player != players[0]) {
                    this.aggro()
                }
            }
            this.move()
            this.repel()
            this.collide()
            this.body.draw()

            // //////console.log(this.healthbar)

        }
        collide() {

            ///mobs

        }
        drawbar() {
            this.healthbarx = new Rectangle((this.body.x - this.body.radius) - .5, (this.body.y - (this.body.radius * 2)) - .5, (this.body.radius * 2) + 1, (this.body.radius * .25) + 1, "black")
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#FFFF00")
            this.healthbar.width = (this.health / this.maxhealth) * this.body.radius * 2
            this.healthbarx.draw()
            this.healthbar.draw()
        }


    }
    class Player {
        constructor(color, x, y) {
            this.color = color
            this.army = []
            this.base = new Circle(x, y, 100, "transparent")
            this.base.body = new Circle(x, y, 100, "transparent")
            this.spawner = 0
            this.selected = []

        }
        steer() {
            if(keysPressed['x']){
                this.selected = []
            }
            for (let t = 0; t < this.selected.length; t++) {
                this.selected[t].body.strokeColor = "black"
            }
        }


        draw() {
            this.burial()
            this.steer()
            this.command()
            this.burial()
            this.spawner++
            if (this.spawner % 100 == 20) {
                let minion = new Mob(this.base.x, this.base.y, this)
                this.army.push(minion)
            }
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                if(!this.selected.includes(this.army[t])){
                    this.army[t].body.strokeColor = this.army[t].body.color
                }
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
        }
    }


    class Vector{
        constructor(object, xmom = 0, ymom = 0){
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point){
            let link = new LineOP(this.object, point)
            let dis1 = link.sqrDis()
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.sqrDis()
            if(dis2 < dis1){
                return true
            }else{
                return false
            }
        }
        rotate(angleGoal){
            let link = new Line(this.xmom, this.ymom, 0,0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude(){
            return (new Line(this.xmom, this.ymom, 0,0)).hypotenuse()
        }
        multiply(vect){
            return new Vector(this.object, this.xmom*vect.xmom, this.ymom*vect.ymom)
        }
        add(vect){
            return new Vector(this.object, this.xmom+vect.xmom, this.ymom+vect.ymom)
        }
        subtract(vect){
            return new Vector(this.object, this.xmom-vect.xmom, this.ymom-vect.ymom)
        }
        divide(vect){
            return new Vector(this.object, this.xmom/vect.xmom, this.ymom/vect.ymom)
        }
        angle(){
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            return link.angle()
        }
        draw(){
            let dummy = new Point(this.object.x+this.xmom, this.object.y+this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }


    class Psychopather{
        constructor(body){
            this.body = body
            this.obstacles = [...obstacles]
            this.waypoints = [this.body]
            this.target = new Circle(350,350, 3, "#00FFFF")
        }
        draw(){
            this.body.draw()
            for(let t = 0;t<this.obstacles.length;t++){
                this.obstacles[t].draw()
            }
            this.path()
        }
        path(){
            let raypoint = new Circle(this.body.x, this.body.y, 1, "#FF00FF", (this.target.x-this.body.x)*.0001, (this.target.y-this.body.y)*.0001)
            let drawmod = 5
            let ultramod = 20
            this.waypoints = [this.body]
            for(let t = 0;t<10000 && (new LineOP(raypoint, this.target)).sqrDis()>10;t++){
                if(t%drawmod == 0){
                    this.waypoints.push(new Circle(raypoint.x, raypoint.y, 3, "transparent"))
                }
                raypoint.move()
                if(t %ultramod == 0){
                  raypoint.xmom = (this.target.x-raypoint.x)*.001
                  raypoint.ymom = (this.target.y-raypoint.y)*.001
                }
                for(let k = 0;k<this.obstacles.length;k++){
                    if(this.obstacles[k].isPointInside(raypoint)){
                        let vec = new Vector(raypoint, raypoint.xmom, raypoint.ymom)
                        vec.rotate(vec.angle()+(Math.PI*.26))
                        for(let t = 0;t<20;t++){
                        raypoint.unmove()
                        }
                        if(vec.isToward(this.target)){
                            raypoint.xmom = vec.xmom// + ((Math.random()-.5)/1000)
                            raypoint.ymom = vec.ymom//+ ((Math.random()-.5)/1000)
                        }else{
                            raypoint.xmom = -vec.xmom//+ ((Math.random()-.5)/1000)
                            raypoint.ymom = -vec.ymom//+ ((Math.random()-.5)/1000)
                        }
                        // t = 1
                        ultramod+=10
                    }
                }
            }
        }
    }


    let obstacles = []

    let ob = new Circle(350,350, 150, "#AA00FF")

    obstacles.push(ob)

    

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 


    let intimates = new Player("#BBA088", 100, 100)
    let adobrasigians = new Player("#FFAA00", 600, 600)

    let selector = new Rectangle(0, 0, 0, 0, "#00000033")
    let players = []
let seldraw = 0
    players.push(intimates)
    players.push(adobrasigians)

    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image

        for(let t = 0;t<obstacles.length;t++){
            obstacles[t].draw()
        }
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // game code goes here
        if (Math.random() < .5) {

            for (let t = 0; t < players.length; t++) {
                players[t].draw()
            }
            for (let t = players.length - 1; t >= 0; t--) {
                for (let k = 0; k < players[t].army.length; k++) {
                    players[t].army[k].drawbar()
                }
            }


        } else {

            for (let t = players.length - 1; t >= 0; t--) {
                players[t].draw()
            }
            for (let t = players.length - 1; t >= 0; t--) {
                for (let k = 0; k < players[t].army.length; k++) {
                    players[t].army[k].drawbar()
                }
            }
        }
        if(seldraw > 0){
            selector.draw()
        }
    }

function selectionbreakstart() {
    clickbreak = setTimeout(function(){ players[0].selected = [] }, 10);
  }
  
  function selectionbreakstop() {
    clearTimeout(clickbreak);
  }
})

