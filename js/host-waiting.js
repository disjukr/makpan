function host_waiting(peer) {
    var $scene = $('#host-waiting-scene');
    $scene.setCurrent();
    var $startButton = $('button.start', $scene);
    $('.room-address span', $scene).text(peer.id);
	(function(){
		var url = window.location.origin + window.location.pathname + '?host=' + peer.id;
		var a = $('<a>');
		a.attr('href', url);
		a.html(url);
		$('.room-url', $scene).append(a);
	})();
    var hostDefaultNick = caragen();
    $('input.nick', $scene).val(hostDefaultNick);
    var guestCount = 0;
    var connSet = new Set();
    var idMap = new WeakMap();
    var nickMap = new WeakMap();
    var defaultNickMap = new WeakMap();
    peer.on('connection', function (conn) {
        (new Promise(function (resolve, reject) {
            if (conn.open) resolve();
            else conn.on('open', resolve);
        })).then(function () {
            ++guestCount;
            var id = guestCount;
            var defaultNick = caragen();
            connSet.add(conn);
            idMap.set(conn, id);
            nickMap.set(conn, defaultNick);
            defaultNickMap.set(conn, defaultNick);
            $guestListUpdate();
            conn.on('data', function (data) {
                switch (data.type) {
                case 'nick':
                    nickMap.set(conn, data.nick || defaultNickMap.get(conn));
                    send_pan_status();
                    break;
                }
            });
            conn.on('close', function () {
                connSet.delete(conn);
                send_pan_status();
            });
            conn.on('error', function (err) {
                console.log('TODO: 잡아야되나?', err);
            });
            conn.send({
                type: 'identity',
                id: id,
                nick: defaultNick
            });
            send_pan_status();
        });
    });
    function $hostNickUpdate() {
        $('.host-nick', $scene).text(host_nick());
    }
    function $guestListUpdate() {
        $guestList = $('ul.guest-list', $scene);
        $guestList.html('');
        connSet.forEach(function (conn) {
            $guestList.append($('<li>').text(nickMap.get(conn)));
        });
    }
    function send_pan_status() {
        $hostNickUpdate();
        $guestListUpdate();
        var guestList = Array.from(connSet).map(function (conn) {
            return {
                id: idMap.get(conn),
                nick: nickMap.get(conn)
            };
        });
        connSet.forEach(function (conn) {
            conn.send({
                type: 'pan_status',
                hostNick: host_nick(),
                width: pan_width(),
                height: pan_height(),
                guestList: guestList
            });
        });
    }
    $([
        '#host-waiting-scene input.nick',
        '#host-waiting-scene .pan-size .width',
        '#host-waiting-scene .pan-size .height'
    ].join(', ')).on('change input keyup', send_pan_status);
    function host_nick() {
        return $('input.nick', $scene).val() || hostDefaultNick;
    }
    function pan_width() {
        return Math.abs($('.pan-size .width', $scene).val()) | 0;
    }
    function pan_height() {
        return Math.abs($('.pan-size .height', $scene).val()) | 0;
    }
    $startButton.on('click', function () {
        var width = pan_width();
        var height = pan_height;
        if (width < 1 || height < 1) {
            alert('적어도 그림판 면적이 1px²보다는 커야 뭔가 그려질 수 있지 않겠어요?');
            return;
        }
        peer.removeAllListeners();
        peer.disconnect();
        // 판을 시작하면 더 이상 새로운 연결을 만들지 않을 것이므로 peer 서버와 연결을 끊는다.
        connSet.forEach(function (conn) {
            conn.removeAllListeners();
            conn.on('close', function () {
                connSet.delete(conn);
            });
        });
        // 이제 판이 시작되기 전까지 conn에서 오는 요청은 무시
        setTimeout(host_drawing, 0,
            { nick: host_nick() }, // host info
            { width: pan_width(), height: pan_height() }, // pan info
            { connSet: connSet, idMap: idMap, nickMap: nickMap } // guest info
        );
    });
}
