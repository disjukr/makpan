function guest_drawing(conn, dataQueue, myId, host_info, pan_info, guestList) {
    var $scene = $('#guest-drawing-scene');
    $scene.setCurrent();
    conn.removeAllListeners('data');
    conn.on('data', handleData);
    conn.on('close', function () {
        alert('판이 종료되었습니다.');
    });
    var id2nickMap = new Map();
    var id2orderMap = new Map();
    guestList.forEach(function (guest) {
        id2nickMap.set(guest.id, guest.nick);
        id2orderMap.set(guest.id, guest.order);
    });
    var order2nickMap = (function () {
        var order2nickMap = new Map();
        guestList.forEach(function (guest) {
            order2nickMap.set(guest.order, guest.nick);
        });
        order2nickMap.set(host_info.order, host_info.nick);
        return order2nickMap;
    })();
    var boardArea = new BoardArea(
        $scene,
        $('.board-area', $scene)[0],
        pan_info.width, pan_info.height,
        guestList.length + 1, // host가 있으니 1 더함
        id2orderMap.get(myId),
        function (data) { conn.send(data); },
        order2nickMap
    );
    var $boardArea = $(boardArea);
    dataQueue.reverse();
    dataQueue.forEach(handleData);
    dataQueue = null; // flush data queue
    function handleData(data) {
        if (data.type === 'board_command') {
            boardArea.doCommand(data);
        } else {
            console.log('TODO: ' + data.type);
        }
    }
    var croquis = boardArea.getMyBoard().croquis;
    $scene.on('touchmove', function (e) {
        e.preventDefault();
    });
    $scene.on('pointerdown', function (e) {
        var coord = boardArea.toCanvasCoord(e.clientX, e.clientY);
        var beforeCoord = { x: e.clientX, y: e.clientY };
        switch (boardArea.currentTool()) {
        case 'brush': case 'eraser':
            croquis.down(coord.x, coord.y);
            break;
        case 'hand':
            $scene.addClass('grab');
            break;
        }
        $scene.on('pointermove', function (e) {
            var coord = boardArea.toCanvasCoord(e.clientX, e.clientY);
            var diffCoord = {
                x: e.clientX - beforeCoord.x,
                y: e.clientY - beforeCoord.y
            };
            switch (boardArea.currentTool()) {
            case 'brush': case 'eraser':
                croquis.move(coord.x, coord.y);
                break;
            case 'hand':
                boardArea.__x__ = boardArea.x + diffCoord.x;
                boardArea.__y__ = boardArea.y + diffCoord.y;
                boardArea.transform(boardArea.x, boardArea.y, boardArea.scale);
                break;
            }
            beforeCoord = { x: e.clientX, y: e.clientY };
        });
        $scene.on('pointerup', function (e) {
            var coord = boardArea.toCanvasCoord(e.clientX, e.clientY);
            switch (boardArea.currentTool()) {
            case 'brush': case 'eraser':
                croquis.up(coord.x, coord.y);
                break;
            case 'hand':
                $scene.removeClass('grab');
                break;
            }
            $scene.off('pointermove pointerup');
        });
    });
    var $toEraserButton = $('button.to-eraser', $scene);
    var $toBrushButton = $('button.to-brush', $scene);
    var $toHandButton = $('button.to-hand', $scene);
    $toEraserButton.on('click', function (e) {
        boardArea.selectEraser();
    });
    $toBrushButton.on('click', function (e) {
        boardArea.selectBrush();
    });
    $toHandButton.on('click', function (e) {
        boardArea.selectTool('hand');
    });
    var $colorInput = $('input[type=color]', $scene);
    $colorInput.val(boardArea.brushColor());
    $colorInput.on('change', function () {
        boardArea.brushColor($colorInput.val());
    });
    var $sideViewButton = $('button.side-view', $scene);
    $sideViewButton.on('pointerdown', function () {
        boardArea.viewFromTheSide();
        $('.side-view-help .try-pointerup', $scene).setCurrent();
    });
    $sideViewButton.on('pointerup', function () {
        boardArea.resetView();
        $('.side-view-help .try-pointerdown', $scene).setCurrent();
    });
    var $save2PsdButton = $('button.save-as-psd', $scene);
    $save2PsdButton.on('click', function () {
        var blobToSave = boardArea.getPsdBlob();
        saveAs(blobToSave, '막판.psd');
    });
    var $allUI = $([
        $('.tool-box', $scene)
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
        if (conn.open)
            return '이 판은 이미 시작된 판이기 때문에 한 번 나가면 다시 들어올 수 없을거에요.';
    };
}
