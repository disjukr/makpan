function guest_drawing(conn, dataQueue, myId, host_info, pan_info, guestList) {
    $('#guest-drawing-scene').setCurrent();
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
        $('#guest-drawing-scene .board-area')[0],
        pan_info.width, pan_info.height,
        guestList.length + 1, // host가 있으니 1 더함
        id2orderMap.get(myId),
        function (data) { conn.send(data); },
        order2nickMap
    );
    var $boardArea = $(boardArea);
    var $window = $(window);
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
    var $toEraserButton = $('#guest-drawing-scene button.to-eraser');
    var $toBrushButton = $('#guest-drawing-scene button.to-brush');
    $toEraserButton.click(function (e) {
        e.preventDefault();
        $toBrushButton.setCurrent();
        boardArea.selectEraser();
    });
    $toBrushButton.click(function (e) {
        e.preventDefault();
        $toEraserButton.setCurrent();
        boardArea.selectBrush();
    });
    var $colorInput = $('#guest-drawing-scene input[type=color]');
    $colorInput.val(boardArea.brushColor());
    $colorInput.on('change', function () {
        boardArea.brushColor($colorInput.val());
    });
    var $layerStatusButton = $('#guest-drawing-scene button.layer-status');
    $layerStatusButton.on('mousedown', function () {
        boardArea.viewFromTheSide();
    });
    $layerStatusButton.on('mouseup', function () {
        boardArea.resetView();
    });
}
