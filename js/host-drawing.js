function host_drawing(host_info, pan_info, guest_info) {
    $('#host-drawing-scene').setCurrent();
    host_info.order = guest_info.connSet.size;
    var connSet = guest_info.connSet;
    var conn2idMap = guest_info.idMap;
    var conn2nickMap = guest_info.nickMap;
    var conn2orderMap = new WeakMap();
    var order2nickMap =  new Map();
    (function () {
        var connList = Array.from(connSet);
        var order = 0;
        connList.forEach(function (conn) {
            conn2orderMap.set(conn, order++);
            order2nickMap.set(conn2orderMap.get(conn), conn2nickMap.get(conn));
        });
        order2nickMap.set(host_info.order, host_info.nick);
        connList.forEach(function (conn) {
            conn.removeAllListeners();
            conn.on('close', function () {
                connSet.delete(conn);
            });
            conn.on('data', function (data) {
                broadcast(data, conn);
                if (data.type === 'board_command') {
                    boardArea.doCommand(data);
                } else {
                    console.log('TODO: ' + data.type);
                }
            });
            conn.send({
                type: 'start_pan',
                width: pan_info.width,
                height: pan_info.height,
                guestList: connList.map(function (conn) {
                    return {
                        id: conn2idMap.get(conn),
                        nick: conn2nickMap.get(conn),
                        order: conn2orderMap.get(conn)
                    };
                }),
                hostNick: host_info.nick,
                hostOrder: host_info.order
            });
        });
    })();
    var boardArea = new BoardArea(
        $('#host-drawing-scene .board-area')[0],
        pan_info.width, pan_info.height,
        connSet.size + 1, // host가 있으니 1 더함
        host_info.order,
        broadcast,
        order2nickMap
    );
    var $boardArea = $(boardArea);
    var $window = $(window);
    window.boardArea = boardArea;
    function broadcast(data, conn) {
        connSet.forEach(function (_conn) {
            if (_conn === conn) return;
            _conn.send(data);
        });
    }
    var croquis = boardArea.getMyBoard().croquis;
    $window.on('mousedown', function (e) {
        if (e.clientX < 0 || e.clientX > pan_info.width) return;
        if (e.clientY < 0 || e.clientY > pan_info.height) return;
        croquis.down(e.clientX, e.clientY);
        $window.on('mousemove', function (e) {
            croquis.move(e.clientX, e.clientY);
        });
        $window.on('mouseup', function (e) {
            croquis.up(e.clientX, e.clientY);
            $window.off('mousemove mouseup');
        });
    });
    var $toEraserButton = $('#host-drawing-scene button.to-eraser');
    var $toBrushButton = $('#host-drawing-scene button.to-brush');
    $toEraserButton.on('click', function (e) {
        $toBrushButton.setCurrent();
        boardArea.selectEraser();
    });
    $toBrushButton.on('click', function (e) {
        e.preventDefault();
        $toEraserButton.setCurrent();
        boardArea.selectBrush();
    });
    var $colorInput = $('#host-drawing-scene input[type=color]');
    $colorInput.val(boardArea.brushColor());
    $colorInput.on('change', function () {
        boardArea.brushColor($colorInput.val());
    });
    var $layerStatusButton = $('#host-drawing-scene button.layer-status');
    $layerStatusButton.on('mousedown', function () {
        boardArea.viewFromTheSide();
    });
    $layerStatusButton.on('mouseup', function () {
        boardArea.resetView();
    });
}
