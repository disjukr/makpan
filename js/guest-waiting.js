function guest_waiting(conn, dataQueue) {
    var $scene = $('#guest-waiting-scene');
    $scene.setCurrent();
    var myId;
    var $nick = $('input.nick', $scene);
    dataQueue.reverse();
    dataQueue.forEach(handleData);
    dataQueue = null; // flush data queue
    conn.removeAllListeners('data');
    conn.on('data', handleData);
    function handleData(data) {
        switch (data.type) {
        case 'identity':
            (function () {
                myId = data.id;
                $nick.val(data.nick);
            })();
            break;
        case 'pan_status':
            (function () {
                $('.host-nick', $scene).text(data.hostNick);
                $('.pan-size .width', $scene).text(data.width);
                $('.pan-size .height', $scene).text(data.height);
                $('ul.guest-list', $scene).html('').append(data.guestList.map(function (guest) {
                    if (guest.id === myId)
                        return $('<li class="me">').text(guest.nick + '(나)');
                    return $('<li>').text(guest.nick);
                }));
            })();
            break;
        case 'start_pan':
            (function () {
                conn.removeAllListeners();
                var dataQueue = [];
                conn.on('data', function (data) {
                    dataQueue.push(data);
                });
                // guest_drawing이 실행되기 전에 들어온 이벤트들은 우선 큐에 쌓는다.
                setTimeout(guest_drawing, 0,
                    conn, dataQueue, myId,
                    { nick: data.hostNick, order: data.hostOrder }, // host info
                    { width: data.width, height: data.height }, // pan info
                    data.guestList
                );
            })();
            break;
        }
    }
    $nick.on('change input keyup', function () {
        conn.send({
            type: 'nick',
            nick: $nick.val()
        });
    });
}
