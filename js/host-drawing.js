function host_drawing(host_info, pan_info, guest_info) {
    var $scene = $('#host-drawing-scene');
    $scene.setCurrent();
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
        $('.board-area', $scene)[0],
        pan_info.width, pan_info.height,
        connSet.size + 1, // host가 있으니 1 더함
        host_info.order,
        broadcast,
        order2nickMap
    );
    var $boardArea = $(boardArea);
    window.boardArea = boardArea;
    function broadcast(data, conn) {
        connSet.forEach(function (_conn) {
            if (_conn === conn) return;
            _conn.send(data);
        });
    }
    var croquis = boardArea.getMyBoard().croquis;
    $scene.on('touchmove', function (e) {
        e.preventDefault();
    });
    $scene.on('pointerdown', function (e) {
        croquis.down(e.clientX, e.clientY);
        $scene.on('pointermove', function (e) {
            croquis.move(e.clientX, e.clientY);
        });
        $scene.on('pointerup', function (e) {
            croquis.up(e.clientX, e.clientY);
            $scene.off('pointermove pointerup');
        });
    });
    var $toEraserButton = $('button.to-eraser', $scene);
    var $toBrushButton = $('button.to-brush', $scene);
    $toEraserButton.on('click', function (e) {
        $toBrushButton.setCurrent();
        boardArea.selectEraser();
    });
    $toBrushButton.on('click', function (e) {
        $toEraserButton.setCurrent();
        boardArea.selectBrush();
    });
    var $colorInput = $('input[type=color]', $scene);
    $colorInput.val(boardArea.brushColor());
    $colorInput.on('change', function () {
        boardArea.brushColor($colorInput.val());
    });
    var $layerStatusButton = $('button.layer-status', $scene);
    $layerStatusButton.on('pointerdown', function () {
        boardArea.viewFromTheSide();
        $('.layer-status-help .try-pointerup', $scene).setCurrent();
    });
    $layerStatusButton.on('pointerup', function () {
        boardArea.resetView();
        $('.layer-status-help .try-pointerdown', $scene).setCurrent();
    });
    var $save2PsdButton = $('button.save-as-psd', $scene);
    $save2PsdButton.on('click', function () {
        var blobToSave = boardArea.getPsdBlob();
        saveAs(blobToSave, '막판.psd');
    });
    var $allUI = $([
        $toEraserButton, $toBrushButton,
        $colorInput,
        $layerStatusButton
    ].map(function ($i) { return $($i)[0]; })).on('pointerdown', function (e) {
        e.stopPropagation(); // prevent scene pointerdown
    });
    key('⌘+z, ctrl+z', function () {
        try { croquis.undo(); } catch (e) {}
    });
    key('⌘+shift+z, ctrl+shift+z', function () {
        try { croquis.redo(); } catch (e) {}
    });
    window.onbeforeunload = function () {
        return '판장이 판을 나가면 남은 사람들은 더 이상 그림을 같이 그릴 수가 없어요.';
    };
}
