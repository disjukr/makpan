function Board(width, height, nick, itsMe) {
    var self = this;
    var croquis = new Croquis();
    croquis.setUndoLimit(0);
    croquis.setCanvasSize(width, height);
    croquis.addLayer();
    croquis.selectLayer(0);
    croquis.setUndoLimit(10);
    self.width = width;
    self.height = height;
    self.nick = nick;
    self.itsMe = itsMe;
    if (itsMe) {
        croquis.setToolStabilizeLevel(10);
        croquis.setToolStabilizeWeight(0.1);
    } else {
        croquis.setToolStabilizeLevel(0);
    }
    self.croquis = croquis;
    self.element = (function () {
        var $div = $('<div class="board">');
        var $nick = $('<span class="nick">').text(nick).css({
            position: 'absolute',
            width: '200px',
            left: width + 'px',
            bottom: 0,
            transition: 'opacity 0.5s',
            opacity: 0
        });
        $div.append(croquis.getDOMElement(), $nick);
        var element = $div[0];
        $(element).css({
            position: 'absolute',
            top: '0',
            left: '0',
            transition: 'opacity 0.5s, transform 0.5s',
            border: '1px solid rgba(0, 0, 0, 0.5)',
            transform: 'translate(-1px, -1px)'
        });
        return element;
    })();
    self.brush = (function () {
        var brush = new Croquis.Brush();
        brush.setSize(3);
        brush.setColor('#000');
        brush.setSpacing(0.2);
        return brush;
    })();
    self.eraser = (function () {
        var eraser = new Croquis.Brush();
        eraser.setSize(20);
        eraser.setColor('#000');
        eraser.setSpacing(0.2);
        return eraser;
    })();
    croquis.setTool(self.brush);
}
Board.prototype.getPsdwLayer = function getPsdwLayer() {
    var self = this;
    var flattenThumbnail = self.croquis.createFlattenThumbnail(self.width, self.height);
    var ctx = flattenThumbnail.getContext('2d');
    var imageData = ctx.getImageData(0, 0, self.width, self.height).data;
    return {
        name: self.nick,
        imageData: imageData,
        width: self.width,
        height: self.height,
        x: 0,
        y: 0,
        opacity: 1,
        blendMode: 'normal',
        __flatten__: flattenThumbnail
    };
};
Board.prototype.viewFromTheSide = function viewFromTheSide(order) {
    var self = this;
    var element = self.element;
    var translateZ = 30 * order;
    $(element).css({
        opacity: self.itsMe ? '1' : '0.2',
        transform: 'translate(-1px, -1px) rotate3d(3.5, -0.5, 0, 60deg) translateZ(' + translateZ + 'px)'
    });
    $('.nick', element).css({
        opacity: 1
    });
};
Board.prototype.resetView = function resetView() {
    var self = this;
    var element = self.element;
    $(element).css({
        opacity: '1',
        transform: 'translate(-1px, -1px)'
    });
    $('.nick', element).css({
        opacity: 0
    });
};
Board.prototype.selectBrush = function selectBrush() {
    var self = this;
    var croquis = self.croquis;
    croquis.setPaintingKnockout(false);
    croquis.setTool(self.brush);
};
Board.prototype.selectEraser = function selectEraser() {
    var self = this;
    var croquis = self.croquis;
    croquis.setPaintingKnockout(true);
    croquis.setTool(self.eraser);
};
Board.prototype.brushColor = function brushColor(color) {
    var self = this;
    var brush = self.brush;
    if (color === undefined)
        return brush.getColor();
    brush.setColor(color);
    return color;
};

function BoardArea($scene, element, width, height, count, myOrder, send, order2nickMap) {
    var self = this;
    var boards = [];
    self.boards = boards;
    self.order = myOrder;
    // self.board
    self.width = width;
    self.height = height;
    self.$scene = $scene;
    self.element = element;
    self.send = send;
    var $areaElement = $(element);
    $areaElement.css({
        width: width + 'px',
        height: height + 'px',
        'background-color': '#fff'
    });
    (function () {
        var currentBoard;
        var $currentBoardElement;
        for (var i = 0; i < count; ++i) {
            currentBoard = new Board(width, height, order2nickMap.get(i), i === myOrder);
            if (i === myOrder) self.board = currentBoard;
            boards.push(currentBoard);
            $areaElement.append(currentBoard.element);
        }
    })();
    var croquis = self.board.croquis;
    croquis.addEventListener('ondown', function (e) {
        send({
            type: 'board_command',
            command: 'down',
            order: self.order,
            x: e.x,
            y: e.y,
            pressure: e.pressure
        });
    });
    croquis.addEventListener('onmove', function (e) {
        send({
            type: 'board_command',
            command: 'move',
            order: self.order,
            x: e.x,
            y: e.y,
            pressure: e.pressure
        });
    });
    croquis.addEventListener('onup', function (e) {
        send({
            type: 'board_command',
            command: 'up',
            order: self.order,
            x: e.x,
            y: e.y,
            pressure: e.pressure
        });
    });
    croquis.addEventListener('onundo', function () {
        send({
            type: 'board_command',
            command: 'undo',
            order: self.order
        });
    });
    croquis.addEventListener('onredo', function () {
        send({
            type: 'board_command',
            command: 'redo',
            order: self.order
        });
    });
    self.selectBrush();
}
BoardArea.prototype.getPsdBlob = function getPsdBlob() {
    var self = this;
    var layers = self.boards.map(function (board) {
        return board.getPsdwLayer();
    });
    var flattenLayer = document.createElement('canvas');
    flattenLayer.width = self.width;
    flattenLayer.height = self.height;
    var flattenLayerContext = flattenLayer.getContext('2d');
    flattenLayerContext.fillStyle = '#fff';
    flattenLayerContext.fillRect(0, 0, self.width, self.height);
    var psdDocumentObject = {
        width: self.width,
        height: self.height,
        layers: layers,
        flattenedImageData: (function () {
            layers.forEach(function (layer) {
                flattenLayerContext.drawImage(layer.__flatten__, 0, 0);
            });
            return flattenLayerContext.getImageData(0, 0, self.width, self.height).data;
        })()
    };
    return psdw(psdDocumentObject).blob;
};
BoardArea.prototype.getMyBoard = function getMyBoard() {
    var self = this;
    return self.boards[self.order];
};
BoardArea.prototype.doCommand = function doCommand(data) {
    var self = this;
    if (data.order === self.order) return;
    var board = self.boards[data.order];
    var croquis = board.croquis;
    switch (data.command) {
    case 'down':
        croquis.down(data.x, data.y, data.pressure);
        break;
    case 'move':
        croquis.move(data.x, data.y, data.pressure);
        break;
    case 'up':
        croquis.up(data.x, data.y, data.pressure);
        break;
    case 'undo':
        croquis.undo();
        break;
    case 'redo':
        croquis.redo();
        break;
    case 'select-eraser':
        board.selectEraser();
        break;
    case 'select-brush':
        board.selectBrush();
        break;
    case 'brush-color':
        board.brushColor(data.color);
        break;
    }
};
BoardArea.prototype.toCanvasCoord = function toCanvasCoord(sceneX, sceneY) {
    var self = this;
    var sx = sceneX;
    var sy = sceneY;
    var sw = $(document.body).width();
    var sh = $(document.body).height();
    var hsw = sw * 0.5;
    var hsh = sh * 0.5;
    var bw = self.width;
    var bh = self.height;
    var hbw = bw * 0.5;
    var hbh = bh * 0.5;
    return {
        x: sx - hsw + hbw - self.x,
        y: sy - hsh + hbh - self.y
    };
};
Object.defineProperty(BoardArea.prototype, 'x', {
    get: function () {
        var self = this;
        return self.__x__ || 0;
    },
    set: function (value) {
        var self = this;
        self.__x__ = value;
        self.transform(self.x, self.y, self.scale);
    }
});
Object.defineProperty(BoardArea.prototype, 'y', {
    get: function () {
        var self = this;
        return self.__y__ || 0;
    },
    set: function (value) {
        var self = this;
        self.__y__ = value;
        self.transform(self.x, self.y, self.scale);
    }
});
Object.defineProperty(BoardArea.prototype, 'scale', {
    get: function () {
        var self = this;
        if (self.__scale__ === undefined) return 1;
        return self.__scale__;
    },
    set: function (value) {
        var self = this;
        self.__scale__ = value;
        self.transform(self.x, self.y, self.scale);
    }
});
BoardArea.prototype.transform = function transform(x, y, scale) {
    var self = this;
    var $areaElement = $(self.element);
    $areaElement.css({
        transform: 'translate(calc(' + x + 'px - 50%), calc(' + y + 'px - 50%))',
        zoom: scale
    });
};
BoardArea.prototype.viewFromTheSide = function viewFromTheSide() {
    var self = this;
    self.boards.forEach(function (board, order) {
        board.viewFromTheSide(order);
    });
};
BoardArea.prototype.resetView = function resetView() {
    var self = this;
    self.boards.forEach(function (board) {
        board.resetView();
    });
};
BoardArea.prototype.currentTool = function currentTool() {
    var self = this;
    var $scene = self.$scene;
    if ($scene.hasClass('brush')) return 'brush';
    if ($scene.hasClass('eraser')) return 'eraser';
    if ($scene.hasClass('hand')) return 'hand';
    self.selectBrush();
    return 'brush';
};
BoardArea.prototype.selectTool = function selectTool(cls) {
    var self = this;
    var $scene = self.$scene;
    $scene.removeClass('brush');
    $scene.removeClass('eraser');
    $scene.removeClass('hand');
    $scene.addClass(cls);
};
BoardArea.prototype.selectBrush = function selectBrush() {
    var self = this;
    var send = self.send;
    self.selectTool('brush');
    self.board.selectBrush();
    send({
        type: 'board_command',
        command: 'select-brush',
        order: self.order
    });
};
BoardArea.prototype.selectEraser = function selectEraser() {
    var self = this;
    var send = self.send;
    self.selectTool('eraser');
    self.board.selectEraser();
    send({
        type: 'board_command',
        command: 'select-eraser',
        order: self.order
    });
};
BoardArea.prototype.brushColor = function brushColor(color) {
    var self = this;
    var send = self.send;
    var result = self.board.brushColor(color);
    if (color === undefined) return result;
    send({
        type: 'board_command',
        command: 'brush-color',
        order: self.order,
        color: color
    });
    return result;
};
