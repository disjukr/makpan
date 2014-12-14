function Board(width, height, nick) {
    var self = this;
    var croquis = new Croquis();
    croquis.setUndoLimit(0);
    croquis.setCanvasSize(width, height);
    croquis.addLayer();
    croquis.selectLayer(0);
    self.__croquis__ = croquis;
    self.__element__ = (function () {
        var $div = $('<div class="board">');
        var $nick = $('<span class="nick">').text(nick).css({
            position: 'absolute',
            width: '200px',
            left: width + 'px',
            bottom: 0,
            transition: 'opacity 0.3s',
            opacity: 0
        });
        $div.append(croquis.getDOMElement(), $nick);
        var element = $div[0];
        $(element).css({
            position: 'absolute',
            top: '0',
            left: '0',
            transition: 'opacity 0.6s, transform 0.6s',
            border: '1px solid rgba(0, 0, 0, 0.5)'
        });
        return element;
    })();
    self.__brush__ = (function () {
        var brush = new Croquis.Brush();
        brush.setSize(3);
        brush.setColor('#000');
        brush.setSpacing(0.2);
        return brush;
    })();
    self.__eraser__ = (function () {
        var eraser = new Croquis.Brush();
        eraser.setSize(20);
        eraser.setColor('#000');
        eraser.setSpacing(0.2);
        return eraser;
    })();
    croquis.setTool(self.__brush__);
}
Board.prototype.viewFromTheSide = function viewFromTheSide(order, itsMe) {
    var self = this;
    var element = self.__element__;
    var translateZ = 30 * order;
    $(element).css({
        opacity: itsMe ? '1' : '0.2',
        transform: 'rotate3d(3.5, -0.5, 0, 60deg) translateZ(' + translateZ + 'px)'
    });
    $('.nick', element).css({
        opacity: 1
    });
};
Board.prototype.resetView = function resetView() {
    var self = this;
    var element = self.__element__;
    $(element).css({
        opacity: '1',
        transform: 'none'
    });
    $('.nick', element).css({
        opacity: 0
    });
};
Board.prototype.selectBrush = function selectBrush() {
    var self = this;
    var croquis = self.__croquis__;
    croquis.setPaintingKnockout(false);
    croquis.setTool(self.__brush__);
};
Board.prototype.selectEraser = function selectEraser() {
    var self = this;
    var croquis = self.__croquis__;
    croquis.setPaintingKnockout(true);
    croquis.setTool(self.__eraser__);
};
Board.prototype.brushColor = function brushColor(color) {
    var self = this;
    var brush = self.__brush__;
    if (color === undefined)
        return brush.getColor();
    brush.setColor(color);
    return color;
};

function BoardArea(element, width, height, count, myOrder, send, order2nickMap) {
    var self = this;
    var boards = [];
    self.boards = boards;
    self.order = myOrder;
    // self.board
    self.width = width;
    self.height = height;
    self.element = element;
    self.send = send;
    var $areaElement = $(element);
    $areaElement.addClass('brush');
    $areaElement.css({
        position: 'relative',
        width: width + 'px',
        height: height + 'px',
        'background-color': '#fff',
        'user-select': 'none',
        'perspective': 1024 + 'px'
    });
    (function () {
        var currentBoard;
        var $currentBoardElement;
        for (var i = 0; i < count; ++i) {
            currentBoard = new Board(width, height, order2nickMap.get(i));
            if (i === myOrder) {
                self.board = currentBoard;
                self.board.__croquis__.setToolStabilizeLevel(20);
                self.board.__croquis__.setToolStabilizeWeight(0.2);
            } else {
                currentBoard.__croquis__.setToolStabilizeLevel(0);
            }
            boards.push(currentBoard);
            $areaElement.append(currentBoard.__element__);
        }
    })();
    var croquis = self.board.__croquis__;
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
}
BoardArea.prototype.getMyBoard = function getMyBoard() {
    var self = this;
    return self.boards[self.order];
};
BoardArea.prototype.doCommand = function doCommand(data) {
    var self = this;
    if (data.order === self.order) return;
    var board = self.boards[data.order];
    var croquis = board.__croquis__;
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
BoardArea.prototype.viewFromTheSide = function viewFromTheSide() {
    var self = this;
    self.boards.forEach(function (board, order) {
        board.viewFromTheSide(order, order === self.order);
    });
};
BoardArea.prototype.resetView = function resetView() {
    var self = this;
    self.boards.forEach(function (board) {
        board.resetView();
    });
};
BoardArea.prototype.selectBrush = function selectBrush() {
    var self = this;
    var send = self.send;
    var $areaElement = $(self.element);
    $areaElement.removeClass('eraser');
    $areaElement.addClass('brush');
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
    var $areaElement = $(self.element);
    $areaElement.removeClass('brush');
    $areaElement.addClass('eraser');
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
