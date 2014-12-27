function guest_drawing(conn, dataQueue, myId, host_info, pan_info, guestList) {
    var $scene = $('#guest-drawing-scene');
    $scene.setCurrent();
    conn.removeAllListeners('data');
    conn.on('data', handleData);
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
        return '이 판은 이미 시작된 판이기 때문에 한 번 나가면 다시 들어올 수 없을거에요.';
    };
}
